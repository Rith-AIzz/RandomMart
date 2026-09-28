import {
  assertSameOrigin,
  ApplicationError,
  toErrorResponse,
} from "../../../../../lib/application-error";
import { canTransitionOrder } from "../../../../../lib/commerce";
import { prisma } from "../../../../../lib/prisma/client";
import { orderStatusSchema } from "../../../../../schemas/admin";
import { writeAudit } from "../../../../../services/audit.service";
import { requirePermission } from "../../../../../services/authorization.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("orders.manage");
    const { id } = await params;
    const input = orderStatusSchema.parse(await request.json());
    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true, totalCents: true, refundedCents: true },
    });
    if (!current) throw new ApplicationError("ORDER_NOT_FOUND", 404);
    if (input.status && !canTransitionOrder(current.status, input.status))
      throw new ApplicationError(
        "INVALID_STATUS_TRANSITION",
        409,
        `Cannot move an order from ${current.status} to ${input.status}.`,
      );
    if (
      input.refundedCents !== undefined &&
      input.refundedCents > current.totalCents
    )
      throw new ApplicationError(
        "INVALID_REFUND",
        422,
        "A refund cannot exceed the order total.",
      );
    const data = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === "CANCELLED"
        ? {
            cancellationReason: input.cancellationReason,
            cancelledAt: new Date(),
          }
        : {}),
      ...(input.refundedCents !== undefined
        ? { refundedCents: input.refundedCents }
        : {}),
    };
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id }, data });
      if (input.refundedCents !== undefined)
        await tx.paymentRecord.updateMany({
          where: { orderId: id, status: "APPROVED" },
          data: {
            status:
              input.refundedCents >= current.totalCents
                ? "REFUNDED"
                : "APPROVED",
          },
        });
      return updated;
    });
    await writeAudit(
      user.id,
      input.refundedCents !== undefined
        ? "order.refund_updated"
        : "order.status_changed",
      "Order",
      id,
      {
        from: current.status,
        to: input.status ?? current.status,
        previousRefundCents: current.refundedCents,
        refundedCents: input.refundedCents,
        cancellationReason: input.cancellationReason,
      },
    );
    return Response.json({ order });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

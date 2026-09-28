import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../lib/application-error";
import { prisma } from "../../../lib/prisma/client";
import { enforceRateLimit, PRESET_RATE_LIMITS } from "../../../lib/rate-limit";
import { orderRequestSchema } from "../../../schemas/checkout";
import { requireUser } from "../../../services/authorization.service";
import { createOrderForUser } from "../../../services/order.service";

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, "get-orders", PRESET_RATE_LIMITS.MUTATION);
    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: { profileId: user.id },
      include: { items: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(
      { orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request, true);
    enforceRateLimit(request, "create-order", PRESET_RATE_LIMITS.AUTH);
    const user = await requireUser();
    const input = orderRequestSchema.parse(await request.json());
    const order = await createOrderForUser(user.id, input);
    return Response.json({ order }, { status: 201 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

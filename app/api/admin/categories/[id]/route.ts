import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../../../lib/application-error";
import { prisma } from "../../../../../lib/prisma/client";
import { categorySchema } from "../../../../../schemas/admin";
import { writeAudit } from "../../../../../services/audit.service";
import { requirePermission } from "../../../../../services/authorization.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("catalog.manage");
    const { id } = await params;
    const input = categorySchema.partial().parse(await request.json());
    const category = await prisma.category.update({
      where: { id },
      data: input,
    });
    await writeAudit(user.id, "category.updated", "Category", id, {
      fields: Object.keys(input),
    });
    return Response.json({ category });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("catalog.manage");
    const { id } = await params;
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    await writeAudit(user.id, "category.archived", "Category", id);
    return Response.json({ category });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

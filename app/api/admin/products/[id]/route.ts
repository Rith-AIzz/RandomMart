import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../../../lib/application-error";
import { prisma } from "../../../../../lib/prisma/client";
import { baseProductSchema } from "../../../../../schemas/product";
import { z } from "zod";
import { ApplicationError } from "../../../../../lib/application-error";
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
    const input = baseProductSchema
      .partial()
      .extend({
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
      .parse(await request.json());
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) throw new ApplicationError("PRODUCT_NOT_FOUND", 404);
    baseProductSchema.parse({
      name: input.name ?? current.name,
      slug: input.slug ?? current.slug,
      sku: input.sku ?? current.sku,
      shortDescription: input.shortDescription ?? current.shortDescription,
      description: input.description ?? current.description,
      priceCents: input.priceCents ?? current.priceCents,
      costCents: input.costCents ?? current.costCents,
      discountCents: input.discountCents ?? current.discountCents ?? undefined,
      stockQuantity: input.stockQuantity ?? current.stockQuantity,
      categoryId: input.categoryId ?? current.categoryId,
    });
    const product = await prisma.product.update({ where: { id }, data: input });
    await writeAudit(user.id, "product.updated", "Product", id, {
      fields: Object.keys(input),
    });
    return Response.json({ product });
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
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    await writeAudit(user.id, "product.archived", "Product", id);
    return Response.json({ product });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../../lib/application-error";
import { prisma } from "../../../../lib/prisma/client";
import { productSchema } from "../../../../schemas/product";
import { writeAudit } from "../../../../services/audit.service";
import { requirePermission } from "../../../../services/authorization.service";

export async function GET() {
  try {
    await requirePermission("catalog.manage");
    const products = await prisma.product.findMany({
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(
      { products },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("catalog.manage");
    const input = productSchema.parse(await request.json());
    const product = await prisma.product.create({
      data: { ...input, isActive: true, isFeatured: false },
    });
    await writeAudit(user.id, "product.created", "Product", product.id, {
      sku: product.sku,
    });
    return Response.json({ product }, { status: 201 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

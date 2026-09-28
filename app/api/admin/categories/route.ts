import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../../lib/application-error";
import { prisma } from "../../../../lib/prisma/client";
import { categorySchema } from "../../../../schemas/admin";
import { writeAudit } from "../../../../services/audit.service";
import { requirePermission } from "../../../../services/authorization.service";

export async function GET() {
  try {
    await requirePermission("catalog.manage");
    return Response.json({
      categories: await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
    });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("catalog.manage");
    const input = categorySchema.parse(await request.json());
    const category = await prisma.category.create({ data: input });
    await writeAudit(user.id, "category.created", "Category", category.id);
    return Response.json({ category }, { status: 201 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

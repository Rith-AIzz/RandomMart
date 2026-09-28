import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../lib/application-error";
import { prisma } from "../../../lib/prisma/client";
import { wishlistItemSchema } from "../../../schemas/wishlist";
import { requireUser } from "../../../services/authorization.service";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.wishlistItem.findMany({
      where: { profileId: user.id, product: { isActive: true } },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    });
    return Response.json(
      { productIds: items.map((item) => item.productId) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { productId } = wishlistItemSchema.parse(await request.json());
    await prisma.wishlistItem.upsert({
      where: { profileId_productId: { profileId: user.id, productId } },
      create: { profileId: user.id, productId },
      update: {},
    });
    return Response.json({ saved: true });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { productId } = wishlistItemSchema.parse(await request.json());
    await prisma.wishlistItem.deleteMany({
      where: { profileId: user.id, productId },
    });
    return new Response(null, { status: 204 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

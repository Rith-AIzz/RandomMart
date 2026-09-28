import {
  ApplicationError,
  assertSameOrigin,
  toErrorResponse,
} from "../../../lib/application-error";
import { prisma } from "../../../lib/prisma/client";
import { reviewCreateSchema } from "../../../schemas/review";
import { requireUser } from "../../../services/authorization.service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = reviewCreateSchema.parse(await request.json());
    const purchased = await prisma.order.findFirst({
      where: {
        profileId: user.id,
        status: "DELIVERED",
        items: { some: { productId: input.productId } },
      },
      select: { id: true },
    });
    if (!purchased)
      throw new ApplicationError(
        "VERIFIED_PURCHASE_REQUIRED",
        403,
        "Reviews are available after a delivered purchase.",
      );
    const review = await prisma.review.upsert({
      where: {
        profileId_productId: { profileId: user.id, productId: input.productId },
      },
      create: { ...input, profileId: user.id, isApproved: false },
      update: {
        rating: input.rating,
        title: input.title,
        body: input.body,
        isApproved: false,
      },
      select: { id: true, rating: true, isApproved: true },
    });
    return Response.json(
      { review, message: "Review submitted for moderation." },
      { status: 201 },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

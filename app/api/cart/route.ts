import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../lib/application-error";
import { cartLineSchema, mergeCartSchema } from "../../../schemas/cart";
import { requireUser } from "../../../services/authorization.service";
import {
  getCartForUser,
  mergeCartForUser,
  setCartLineForUser,
} from "../../../services/cart.service";

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json(
      { lines: await getCartForUser(user.id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const line = cartLineSchema.parse(await request.json());
    return Response.json({
      lines: await setCartLineForUser(user.id, line.productId, line.quantity),
    });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { lines } = mergeCartSchema.parse(await request.json());
    return Response.json({ lines: await mergeCartForUser(user.id, lines) });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const lines = await getCartForUser(user.id);
    for (const line of lines)
      await setCartLineForUser(user.id, line.productId, 0);
    return Response.json({ lines: [] });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

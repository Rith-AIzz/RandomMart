import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../../lib/application-error";
import { prisma } from "../../../../lib/prisma/client";
import { requirePermission } from "../../../../services/authorization.service";

export async function GET() {
  try {
    const { user } = await requirePermission("admin.access");
    const notifications = await prisma.notification.findMany({
      where: { profileId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(
      { notifications },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("admin.access");
    await prisma.notification.updateMany({
      where: { profileId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return Response.json({ updated: true });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

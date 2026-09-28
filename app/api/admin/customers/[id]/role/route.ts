import {
  assertSameOrigin,
  ApplicationError,
  toErrorResponse,
} from "../../../../../../lib/application-error";
import { prisma } from "../../../../../../lib/prisma/client";
import { roleUpdateSchema } from "../../../../../../schemas/admin";
import { writeAudit } from "../../../../../../services/audit.service";
import { requirePermission } from "../../../../../../services/authorization.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("roles.manage");
    const { id } = await params;
    const { role } = roleUpdateSchema.parse(await request.json());
    const current = await prisma.profile.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!current) throw new ApplicationError("PROFILE_NOT_FOUND", 404);
    if (current.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.profile.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1)
        throw new ApplicationError(
          "LAST_ADMIN",
          409,
          "The final administrator's role cannot be changed.",
        );
    }
    const profile = await prisma.profile.update({
      where: { id },
      data: { role },
    });
    await writeAudit(user.id, "profile.role_changed", "Profile", id, {
      from: current.role,
      to: role,
      selfChange: user.id === id,
    });
    return Response.json({ profile: { id: profile.id, role: profile.role } });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

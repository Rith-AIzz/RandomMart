import {
  assertSameOrigin,
  ApplicationError,
  toErrorResponse,
} from "../../../../../lib/application-error";
import { prisma } from "../../../../../lib/prisma/client";
import { writeAudit } from "../../../../../services/audit.service";
import { requirePermission } from "../../../../../services/authorization.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("admin.access");
    const { id } = await params;
    const report = await prisma.savedReport.findFirst({
      where: { id, profileId: user.id },
    });
    if (!report) throw new ApplicationError("REPORT_NOT_FOUND", 404);
    await prisma.savedReport.delete({ where: { id } });
    await writeAudit(user.id, "report.deleted", "SavedReport", id, {
      name: report.name,
    });
    return new Response(null, { status: 204 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

import {
  assertSameOrigin,
  ApplicationError,
  toErrorResponse,
} from "../../../../lib/application-error";
import { prisma } from "../../../../lib/prisma/client";
import { savedReportSchema } from "../../../../schemas/report";
import { writeAudit } from "../../../../services/audit.service";
import { requirePermission } from "../../../../services/authorization.service";

export async function GET() {
  try {
    const { user } = await requirePermission("admin.access");
    const reports = await prisma.savedReport.findMany({
      where: { profileId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    return Response.json(
      { reports },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { user } = await requirePermission("admin.access");
    const input = savedReportSchema.parse(await request.json());
    const count = await prisma.savedReport.count({
      where: { profileId: user.id },
    });
    const existing = await prisma.savedReport.findUnique({
      where: { profileId_name: { profileId: user.id, name: input.name } },
    });
    if (!existing && count >= 20)
      throw new ApplicationError(
        "REPORT_LIMIT",
        409,
        "You can save up to 20 reports.",
      );
    const report = await prisma.savedReport.upsert({
      where: { profileId_name: { profileId: user.id, name: input.name } },
      update: { filters: input.filters },
      create: { profileId: user.id, name: input.name, filters: input.filters },
    });
    await writeAudit(user.id, "report.saved", "SavedReport", report.id, {
      name: report.name,
    });
    return Response.json({ report }, { status: existing ? 200 : 201 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

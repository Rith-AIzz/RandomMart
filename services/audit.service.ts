import { prisma } from "../lib/prisma/client";
import type { Prisma } from "../generated/prisma/client";

export async function writeAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

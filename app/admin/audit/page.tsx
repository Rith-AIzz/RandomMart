import { AdminShell } from "../../../components/admin-shell";
import { prisma } from "../../../lib/prisma/client";
import { isLiveMode } from "../../../lib/runtime-config";
import { requirePermission } from "../../../services/authorization.service";

export default async function AuditPage() {
  const liveMode = isLiveMode();
  if (liveMode) await requirePermission("audit.read");
  const logs = liveMode
    ? await prisma.auditLog.findMany({
        include: { actor: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];
  return (
    <AdminShell>
      <div className="admin-title">
        <div>
          <p className="eyebrow">Accountability</p>
          <h1>Audit log</h1>
        </div>
        <span className="status">Latest 100 events</span>
      </div>
      {!liveMode ? (
        <div className="empty-state">
          <h2>Live mode required</h2>
          <p>
            Administrative mutations will be recorded here after Supabase is connected.
          </p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.createdAt.toLocaleString()}</td>
                    <td>{log.actor?.email ?? "System"}</td>
                    <td>{log.action}</td>
                    <td>
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

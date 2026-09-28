import { AdminCustomerManager } from "../../../components/admin-customer-manager";
import { AdminShell } from "../../../components/admin-shell";
import { prisma } from "../../../lib/prisma/client";
import { isLiveMode } from "../../../lib/runtime-config";
import { hasPermission, type AppRole } from "../../../lib/permissions";
import { requirePermission } from "../../../services/authorization.service";

const sampleNames = [
  "Maya Chen",
  "Sokha Lim",
  "Alex Morgan",
  "Nita Dara",
  "Nhem Darith",
  "Lin Sreyneang",
];

export default async function CustomersPage() {
  const liveMode = isLiveMode();
  const authorization = liveMode
    ? await requirePermission("customers.read")
    : null;
  const rows = liveMode
    ? await prisma.profile.findMany({
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];
  const customers = liveMode
    ? rows.map((row) => ({
        id: row.id,
        name: row.fullName,
        email: row.email,
        orders: row._count.orders,
        role: row.role as AppRole,
        joined: row.createdAt.toLocaleDateString(),
      }))
    : sampleNames.map((name, index) => ({
        id: name,
        name,
        email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
        orders: index + 1,
        role: (index === 4
          ? "MANAGER"
          : index === 5
            ? "SUPPORT"
            : "CUSTOMER") as AppRole,
        joined: `Jul ${15 - index}, 2026`,
      }));
  const canManageRoles = Boolean(
    authorization &&
    hasPermission(authorization.profile.role as AppRole, "roles.manage"),
  );
  return (
    <AdminShell>
      <AdminCustomerManager
        customers={customers}
        canManageRoles={canManageRoles}
      />
    </AdminShell>
  );
}

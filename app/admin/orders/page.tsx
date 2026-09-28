import { AdminOrderManager } from "../../../components/admin-order-manager";
import { AdminShell } from "../../../components/admin-shell";
import { prisma } from "../../../lib/prisma/client";
import { isLiveMode } from "../../../lib/runtime-config";
import { requirePermission } from "../../../services/authorization.service";

const statuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
type DisplayOrder = {
  id: string;
  number: string;
  customer: string;
  date: string;
  status: string;
  payment: string;
  total: number;
  refundedCents: number;
  cancellationReason: string | null;
};
const sampleOrders = Array.from({ length: 10 }, (_, index) => ({
  id: `sample-${index}`,
  number: `RM-2026-${814532 - index * 23}`,
  customer: ["Maya Chen", "Sokha Lim", "Alex Morgan", "Nita Dara"][index % 4],
  status: statuses[index % 4],
  total: 6800 + index * 1250,
  date: `Jul ${21 - index}, 2026`,
  payment: "APPROVED",
  refundedCents: index === 8 ? 2000 : 0,
  cancellationReason: null,
}));

function safeDate(value: unknown, end = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return undefined;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const liveMode = isLiveMode();
  if (liveMode) await requirePermission("orders.manage");
  const status =
    typeof params.status === "string" &&
    statuses.includes(params.status as (typeof statuses)[number])
      ? (params.status as (typeof statuses)[number])
      : undefined;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const from = safeDate(params.from);
  const to = safeDate(params.to, true);
  const rows = liveMode
    ? await prisma.order.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
          ...(q
            ? {
                OR: [
                  { orderNumber: { contains: q, mode: "insensitive" } },
                  {
                    profile: { fullName: { contains: q, mode: "insensitive" } },
                  },
                ],
              }
            : {}),
        },
        include: {
          profile: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      })
    : [];
  let orders: DisplayOrder[] = liveMode
    ? rows.map((row) => ({
        id: row.id,
        number: row.orderNumber,
        customer: row.profile?.fullName ?? row.guestEmail ?? "Guest",
        date: row.createdAt.toLocaleDateString(),
        status: row.status,
        payment: row.payments[0]?.status ?? "PENDING",
        total: row.totalCents,
        refundedCents: row.refundedCents,
        cancellationReason: row.cancellationReason,
      }))
    : sampleOrders;
  if (!liveMode)
    orders = orders.filter(
      (order) =>
        (!status || order.status === status) &&
        (!q ||
          `${order.number} ${order.customer}`
            .toLowerCase()
            .includes(q.toLowerCase())),
    );
  return (
    <AdminShell>
      <AdminOrderManager
        orders={orders}
        liveMode={liveMode}
        filters={{
          status: status ?? "",
          from: typeof params.from === "string" ? params.from : "",
          to: typeof params.to === "string" ? params.to : "",
          q,
        }}
      />
    </AdminShell>
  );
}

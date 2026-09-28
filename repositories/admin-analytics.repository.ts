import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma/client";
import type { DashboardRange } from "../lib/admin-analytics";

type SummaryRow = {
  current_sales: bigint;
  previous_sales: bigint;
  current_orders: bigint;
  previous_orders: bigint;
  current_cost: bigint;
  previous_cost: bigint;
  current_refunds: bigint;
  previous_refunds: bigint;
};
type DailyRow = {
  bucket: string;
  revenue_cents: bigint;
  orders: bigint;
  cost_cents: bigint;
  refunded_cents: bigint;
};
type StatusRow = { status: string; count: bigint };
type ProductRow = {
  product_id: string | null;
  product_name: string;
  units: bigint;
  revenue_cents: bigint;
  cost_cents: bigint;
};

export async function getDashboardAggregates(range: DashboardRange) {
  const [summaryRows, dailyRows, statusRows, productRows] = await Promise.all([
    prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      with item_costs as (
        select order_id, coalesce(sum(line_cost_cents), 0)::bigint as cost_cents
        from public.order_items group by order_id
      )
      select
        coalesce(sum(greatest(o.total_cents - o.refunded_cents, 0)) filter (where o.created_at >= ${range.from} and o.created_at < ${range.endExclusive} and o.status <> 'CANCELLED'), 0)::bigint as current_sales,
        coalesce(sum(greatest(o.total_cents - o.refunded_cents, 0)) filter (where o.created_at >= ${range.previousFrom} and o.created_at < ${range.previousEndExclusive} and o.status <> 'CANCELLED'), 0)::bigint as previous_sales,
        count(*) filter (where o.created_at >= ${range.from} and o.created_at < ${range.endExclusive})::bigint as current_orders,
        count(*) filter (where o.created_at >= ${range.previousFrom} and o.created_at < ${range.previousEndExclusive})::bigint as previous_orders,
        coalesce(sum(c.cost_cents) filter (where o.created_at >= ${range.from} and o.created_at < ${range.endExclusive} and o.status <> 'CANCELLED'), 0)::bigint as current_cost,
        coalesce(sum(c.cost_cents) filter (where o.created_at >= ${range.previousFrom} and o.created_at < ${range.previousEndExclusive} and o.status <> 'CANCELLED'), 0)::bigint as previous_cost,
        coalesce(sum(o.refunded_cents) filter (where o.created_at >= ${range.from} and o.created_at < ${range.endExclusive}), 0)::bigint as current_refunds,
        coalesce(sum(o.refunded_cents) filter (where o.created_at >= ${range.previousFrom} and o.created_at < ${range.previousEndExclusive}), 0)::bigint as previous_refunds
      from public.orders o left join item_costs c on c.order_id = o.id
      where o.created_at >= ${range.previousFrom} and o.created_at < ${range.endExclusive}
    `),
    prisma.$queryRaw<DailyRow[]>(Prisma.sql`
      with item_costs as (select order_id, coalesce(sum(line_cost_cents), 0)::bigint as cost_cents from public.order_items group by order_id)
      select to_char(date_trunc('day', o.created_at at time zone ${range.timeZone}), 'YYYY-MM-DD') as bucket,
        coalesce(sum(case when o.status <> 'CANCELLED' then greatest(o.total_cents - o.refunded_cents, 0) else 0 end), 0)::bigint as revenue_cents,
        count(*)::bigint as orders,
        coalesce(sum(case when o.status <> 'CANCELLED' then c.cost_cents else 0 end), 0)::bigint as cost_cents,
        coalesce(sum(o.refunded_cents), 0)::bigint as refunded_cents
      from public.orders o left join item_costs c on c.order_id = o.id
      where o.created_at >= ${range.from} and o.created_at < ${range.endExclusive}
      group by 1 order by 1
    `),
    prisma.$queryRaw<StatusRow[]>(Prisma.sql`
      select status::text as status, count(*)::bigint as count from public.orders
      where created_at >= ${range.from} and created_at < ${range.endExclusive}
      group by status order by status
    `),
    prisma.$queryRaw<ProductRow[]>(Prisma.sql`
      select i.product_id, i.product_name, sum(i.quantity)::bigint as units,
        sum(i.line_total_cents)::bigint as revenue_cents, sum(i.line_cost_cents)::bigint as cost_cents
      from public.order_items i join public.orders o on o.id = i.order_id
      where o.created_at >= ${range.from} and o.created_at < ${range.endExclusive} and o.status <> 'CANCELLED'
      group by i.product_id, i.product_name order by revenue_cents desc limit 10
    `),
  ]);

  const zero = 0 as unknown as bigint;
  const summary = summaryRows[0] ?? {
    current_sales: zero,
    previous_sales: zero,
    current_orders: zero,
    previous_orders: zero,
    current_cost: zero,
    previous_cost: zero,
    current_refunds: zero,
    previous_refunds: zero,
  };
  return {
    summary: Object.fromEntries(
      Object.entries(summary).map(([key, value]) => [key, Number(value)]),
    ) as Record<keyof SummaryRow, number>,
    daily: dailyRows.map((row) => ({
      bucket: row.bucket,
      revenueCents: Number(row.revenue_cents),
      orders: Number(row.orders),
      costCents: Number(row.cost_cents),
      refundedCents: Number(row.refunded_cents),
    })),
    statuses: statusRows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),
    products: productRows.map((row) => ({
      productId: row.product_id,
      name: row.product_name,
      units: Number(row.units),
      revenueCents: Number(row.revenue_cents),
      costCents: Number(row.cost_cents),
    })),
  };
}

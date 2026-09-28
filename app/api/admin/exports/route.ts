import {
  toErrorResponse,
  ApplicationError,
} from "../../../../lib/application-error";
import { parseDashboardRange } from "../../../../lib/admin-analytics";
import { prisma } from "../../../../lib/prisma/client";
import { isLiveMode } from "../../../../lib/runtime-config";
import { getDashboardAggregates } from "../../../../repositories/admin-analytics.repository";
import { writeAudit } from "../../../../services/audit.service";
import { requirePermission } from "../../../../services/authorization.service";

const MAX_ROWS = 10_000;

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function csv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const report = url.searchParams.get("report") ?? "orders";
    const range = parseDashboardRange(
      Object.fromEntries(url.searchParams.entries()),
      new Date(),
      process.env.STORE_TIME_ZONE ?? "Asia/Bangkok",
    );
    if (!isLiveMode()) {
      const body = csv(
        ["Report", "Period", "Status"],
        [[report, `${range.fromInput} to ${range.toInput}`, "Sample data"]],
      );
      return new Response(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="randommart-${report}-${range.fromInput}-${range.toInput}.csv"`,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const { user } = await requirePermission(
      report === "inventory"
        ? "catalog.manage"
        : report === "customers"
          ? "customers.read"
          : "orders.manage",
    );
    let headers: string[];
    let rows: unknown[][];

    if (report === "orders") {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: range.from, lt: range.endExclusive } },
        select: {
          orderNumber: true,
          createdAt: true,
          status: true,
          totalCents: true,
          refundedCents: true,
          cancellationReason: true,
          guestEmail: true,
          profile: { select: { fullName: true, email: true } },
          items: { select: { lineCostCents: true } },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      headers = [
        "Order",
        "Customer",
        "Email",
        "Date",
        "Status",
        "Revenue USD",
        "Refunded USD",
        "Cost USD",
        "Gross profit USD",
        "Cancellation reason",
      ];
      rows = orders.map((order) => {
        const cost = order.items.reduce(
          (sum, item) => sum + item.lineCostCents,
          0,
        );
        const net = Math.max(order.totalCents - order.refundedCents, 0);
        return [
          order.orderNumber,
          order.profile?.fullName ?? order.guestEmail ?? "Guest",
          order.profile?.email ?? order.guestEmail ?? "guest@example.com",
          order.createdAt.toISOString(),
          order.status,
          (net / 100).toFixed(2),
          (order.refundedCents / 100).toFixed(2),
          (cost / 100).toFixed(2),
          ((net - cost) / 100).toFixed(2),
          order.cancellationReason ?? "",
        ];
      });
    } else if (report === "sales") {
      const analytics = await getDashboardAggregates(range);
      headers = [
        "Date",
        "Revenue USD",
        "Orders",
        "Cost USD",
        "Refunded USD",
        "Gross profit USD",
      ];
      rows = analytics.daily.map((day) => [
        day.bucket,
        (day.revenueCents / 100).toFixed(2),
        day.orders,
        (day.costCents / 100).toFixed(2),
        (day.refundedCents / 100).toFixed(2),
        ((day.revenueCents - day.costCents) / 100).toFixed(2),
      ]);
    } else if (report === "inventory") {
      const products = await prisma.product.findMany({
        select: {
          name: true,
          sku: true,
          stockQuantity: true,
          costCents: true,
          priceCents: true,
          images: { select: { id: true }, take: 1 },
        },
        orderBy: { name: "asc" },
        take: MAX_ROWS,
      });
      headers = [
        "Product",
        "SKU",
        "Stock",
        "Cost USD",
        "Price USD",
        "Margin percent",
        "Missing image",
      ];
      rows = products.map((product) => [
        product.name,
        product.sku,
        product.stockQuantity,
        (product.costCents / 100).toFixed(2),
        (product.priceCents / 100).toFixed(2),
        product.priceCents
          ? (
              ((product.priceCents - product.costCents) / product.priceCents) *
              100
            ).toFixed(1)
          : "0",
        product.images.length ? "No" : "Yes",
      ]);
    } else if (report === "customers") {
      const customers = await prisma.profile.findMany({
        where: { createdAt: { gte: range.from, lt: range.endExclusive } },
        select: {
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            select: { totalCents: true, refundedCents: true },
            where: { status: { not: "CANCELLED" } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      headers = [
        "Customer",
        "Email",
        "Role",
        "Joined",
        "Orders",
        "Lifetime value USD",
      ];
      rows = customers.map((customer) => [
        customer.fullName,
        customer.email,
        customer.role,
        customer.createdAt.toISOString(),
        customer._count.orders,
        (
          customer.orders.reduce(
            (sum, order) =>
              sum + Math.max(order.totalCents - order.refundedCents, 0),
            0,
          ) / 100
        ).toFixed(2),
      ]);
    } else {
      throw new ApplicationError("INVALID_REPORT", 422, "Unknown report type.");
    }

    await writeAudit(user.id, "report.exported", "Report", report, {
      from: range.fromInput,
      to: range.toInput,
      timeZone: range.timeZone,
      rows: rows.length,
      capped: rows.length === MAX_ROWS,
    });
    return new Response(csv(headers, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="randommart-${report}-${range.fromInput}-${range.toInput}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

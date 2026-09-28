import { AdminDashboard, type ActionItem, type InventoryAlert, type RecentOrder, type SystemHealthItem } from "../../components/admin-dashboard";
import { AdminShell } from "../../components/admin-shell";
import { SavedReportControls } from "../../components/saved-report-controls";
import {
  buildChartSeries,
  parseDashboardRange,
  percentageChange,
  type DashboardRange,
} from "../../lib/admin-analytics";
import { hasPermission, type AppRole } from "../../lib/permissions";
import { prisma } from "../../lib/prisma/client";
import { products as sampleProducts, formatMoney } from "../../lib/products";
import { getPublicSupabaseConfig, isLiveMode } from "../../lib/runtime-config";
import { createAdminClient } from "../../lib/supabase/admin";
import { getDashboardAggregates } from "../../repositories/admin-analytics.repository";
import { requirePermission } from "../../services/authorization.service";

type AnalyticsOrder = {
  id: string;
  number: string;
  customer: string;
  createdAt: Date;
  status: string;
  totalCents: number;
  declinedPayment: boolean;
  paymentStatus: "PAID" | "PENDING" | "DECLINED" | "REFUNDED";
  items: Array<{
    productId: string | null;
    name: string;
    image: string | null;
    quantity: number;
    revenueCents: number;
    costCents: number;
  }>;
};

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const sampleCustomers = [
  "Maya Chen",
  "Sokha Lim",
  "Alex Morgan",
  "Nita Dara",
  "Nhem Darith",
  "Lin Sreyneang",
];

function inPeriod(date: Date, from: Date, endExclusive: Date) {
  return date >= from && date < endExclusive;
}

function sampleOrders(
  range: DashboardRange,
  previous = false,
): AnalyticsOrder[] {
  const from = previous ? range.previousFrom : range.from;
  const days = range.days;
  const scale = previous ? 0.86 : 1;
  const rows: AnalyticsOrder[] = [];

  for (let day = 0; day < days; day += 1) {
    const createdAt = new Date(from);
    createdAt.setUTCDate(from.getUTCDate() + day);
    const count = Math.max(1, Math.round((3 + ((day * 7) % 5)) * scale));
    for (let index = 0; index < count; index += 1) {
      const product = sampleProducts[(day * 3 + index) % sampleProducts.length];
      const quantity = 1 + ((day + index) % 3);
      const unitPrice = product.discountCents ?? product.priceCents;
      const isDeclined = (day + index) % 17 === 0;
      rows.push({
        id: `sample-${previous ? "previous" : "current"}-${day}-${index}`,
        number: `RM-${createdAt.getUTCFullYear()}-${String(810000 + day * 10 + index)}`,
        customer: sampleCustomers[(day + index) % sampleCustomers.length],
        createdAt,
        status: orderStatuses[(day + index) % orderStatuses.length],
        totalCents: unitPrice * quantity,
        declinedPayment: isDeclined,
        paymentStatus: isDeclined ? "DECLINED" : "PAID",
        items: [
          {
            productId: product.id,
            name: product.name,
            image: product.image,
            quantity,
            revenueCents: unitPrice * quantity,
            costCents: Math.round(product.priceCents * 0.55) * quantity,
          },
        ],
      });
    }
  }
  return rows;
}

function storageImage(path: string | null | undefined) {
  if (!path) return "/images/randommart-products-a.png";
  if (/^(https?:)?\//.test(path)) return path;
  const config = getPublicSupabaseConfig();
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return config
    ? `${config.url}/storage/v1/object/public/product-images/${safePath}`
    : "/images/randommart-products-a.png";
}

async function countUnverifiedAccounts(enabled: boolean) {
  if (!enabled) return 0;
  try {
    const { data, error } = await createAdminClient().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) return 0;
    return data.users.filter((user) => !user.email_confirmed_at).length;
  } catch {
    return 0;
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(
    params,
    new Date(),
    process.env.STORE_TIME_ZONE ?? "Asia/Bangkok",
  );
  const chartMode =
    params.metric === "orders" ? ("orders" as const) : ("revenue" as const);
  const liveMode = isLiveMode();
  const authorization = liveMode
    ? await requirePermission("admin.access")
    : null;
  const role = (authorization?.profile.role ?? "ADMIN") as AppRole;
  const canManageCatalog = hasPermission(role, "catalog.manage");
  const canManageRoles = hasPermission(role, "roles.manage");

  let allOrders: AnalyticsOrder[];
  let productRows: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    image: string;
    imagePosition?: string;
    missingImage: boolean;
  }>;
  let currentCustomers: Array<{
    name: string;
    email: string;
    joined: Date;
    role: string;
  }>;
  let previousCustomerCount: number;
  let unapprovedReviewsCount = 0;

  if (liveMode) {
    const [
      databaseOrders,
      databaseProducts,
      customerRows,
      earlierCustomerCount,
      unapprovedReviews,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: range.previousFrom, lt: range.endExclusive },
        },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          totalCents: true,
          guestEmail: true,
          profile: { select: { fullName: true } },
          payments: { select: { status: true } },
          items: {
            select: {
              productId: true,
              productName: true,
              productImage: true,
              quantity: true,
              lineTotalCents: true,
              lineCostCents: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      canManageCatalog
        ? prisma.product.findMany({
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              stockQuantity: true,
              images: {
                select: { path: true },
                orderBy: { sortOrder: "asc" },
                take: 1,
              },
            },
          })
        : Promise.resolve([]),
      prisma.profile.findMany({
        where: { createdAt: { gte: range.from, lt: range.endExclusive } },
        select: { fullName: true, email: true, createdAt: true, role: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.profile.count({
        where: {
          createdAt: {
            gte: range.previousFrom,
            lt: range.previousEndExclusive,
          },
        },
      }),
      prisma.review.count({ where: { isApproved: false } }),
    ]);

    allOrders = databaseOrders.map((order) => {
      const isDeclined = order.payments.some((p) => p.status === "DECLINED");
      const isPaid = order.payments.some((p) => p.status === "APPROVED");
      return {
        id: order.id,
        number: order.orderNumber,
        customer: order.profile?.fullName ?? order.guestEmail ?? "Guest",
        createdAt: order.createdAt,
        status: order.status,
        totalCents: order.totalCents,
        declinedPayment: isDeclined,
        paymentStatus: isDeclined ? "DECLINED" : isPaid ? "PAID" : "PENDING",
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          image: item.productImage,
          quantity: item.quantity,
          revenueCents: item.lineTotalCents,
          costCents: item.lineCostCents,
        })),
      };
    });
    productRows = databaseProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stockQuantity,
      image: storageImage(product.images[0]?.path),
      missingImage: product.images.length === 0,
    }));
    currentCustomers = customerRows.map((customer) => ({
      name: customer.fullName,
      email: customer.email,
      joined: customer.createdAt,
      role: customer.role,
    }));
    previousCustomerCount = earlierCustomerCount;
    unapprovedReviewsCount = unapprovedReviews;
  } else {
    allOrders = [...sampleOrders(range, true), ...sampleOrders(range)];
    productRows = sampleProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      image: product.image,
      imagePosition: product.imagePosition,
      missingImage: false,
    }));
    currentCustomers = sampleCustomers
      .slice(
        0,
        Math.min(
          sampleCustomers.length,
          Math.max(2, Math.ceil(range.days / 15)),
        ),
      )
      .map((name, index) => ({
        name,
        email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
        joined: new Date(range.from.valueOf() + index * 86_400_000),
        role: "CUSTOMER",
      }));
    previousCustomerCount = Math.max(1, currentCustomers.length - 1);
    unapprovedReviewsCount = 2;
  }

  const currentOrders = allOrders.filter((order) =>
    inPeriod(order.createdAt, range.from, range.endExclusive),
  );
  const previousOrders = allOrders.filter((order) =>
    inPeriod(order.createdAt, range.previousFrom, range.previousEndExclusive),
  );
  const currentCompleted = currentOrders.filter(
    (order) => order.status !== "CANCELLED",
  );
  const previousCompleted = previousOrders.filter(
    (order) => order.status !== "CANCELLED",
  );
  const aggregates = liveMode ? await getDashboardAggregates(range) : null;
  const currentSales =
    aggregates?.summary.current_sales ??
    currentCompleted.reduce((sum, order) => sum + order.totalCents, 0);
  const previousSales =
    aggregates?.summary.previous_sales ??
    previousCompleted.reduce((sum, order) => sum + order.totalCents, 0);
  const currentAverage = currentCompleted.length
    ? Math.round(currentSales / currentCompleted.length)
    : 0;
  const previousAverage = previousCompleted.length
    ? Math.round(previousSales / previousCompleted.length)
    : 0;
  const currentCost =
    aggregates?.summary.current_cost ??
    currentCompleted
      .flatMap((order) => order.items)
      .reduce((sum, item) => sum + item.costCents, 0);
  const previousCost =
    aggregates?.summary.previous_cost ??
    previousCompleted
      .flatMap((order) => order.items)
      .reduce((sum, item) => sum + item.costCents, 0);
  const currentRefunds = aggregates?.summary.current_refunds ?? 0;
  const previousRefunds = aggregates?.summary.previous_refunds ?? 0;
  const chart = buildChartSeries(currentOrders, range);

  // Compute Action Required Items
  const pendingOrdersCount = currentOrders.filter((o) => o.status === "PENDING").length;
  const lowStockCount = productRows.filter((p) => p.stock > 3 && p.stock <= 10).length;
  const criticalStockCount = productRows.filter((p) => p.stock <= 3).length;
  const failedPaymentsCount = currentOrders.filter((o) => o.declinedPayment).length;

  const actionItems: ActionItem[] = [
    {
      key: "pending",
      label: "Pending Orders",
      count: pendingOrdersCount,
      detail: "Orders waiting for fulfillment & confirmation",
      href: "/admin/orders?status=PENDING",
      tone: "warning",
    },
    {
      key: "critical-stock",
      label: "Critical Stock Products",
      count: criticalStockCount,
      detail: "Items with 3 or fewer units remaining",
      href: "/admin/inventory?filter=critical",
      tone: "critical",
    },
    {
      key: "low-stock",
      label: "Low Stock Products",
      count: lowStockCount,
      detail: "Products approaching reorder threshold",
      href: "/admin/inventory?filter=low",
      tone: "warning",
    },
    {
      key: "failed-payments",
      label: "Failed Payments",
      count: failedPaymentsCount,
      detail: "Transactions flagged with payment processing error",
      href: "/admin/orders?payment=DECLINED",
      tone: "critical",
    },
    {
      key: "unapproved-reviews",
      label: "Unapproved Customer Reviews",
      count: unapprovedReviewsCount,
      detail: "Submitted reviews pending moderation approval",
      href: "/admin/reviews",
      tone: "info",
    },
  ];

  // Top Products Widget Data
  const productLookup = new Map(productRows.map((p) => [p.id, p]));
  const productPerformance = new Map<
    string,
    {
      id: string;
      name: string;
      image: string;
      unitsSold: number;
      revenueCents: number;
      stock: number;
    }
  >();
  currentCompleted
    .flatMap((order) => order.items)
    .forEach((item) => {
      const key = item.productId ?? item.name;
      const product = item.productId ? productLookup.get(item.productId) : undefined;
      const existing = productPerformance.get(key);
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenueCents += item.revenueCents;
      } else {
        productPerformance.set(key, {
          id: key,
          name: item.name,
          image: product?.image ?? storageImage(item.image),
          unitsSold: item.quantity,
          revenueCents: item.revenueCents,
          stock: product?.stock ?? 0,
        });
      }
    });
  const topProducts = [...productPerformance.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  // Inventory Alerts Widget Data
  const inventoryAlerts: InventoryAlert[] = productRows
    .filter((p) => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      level: p.stock === 0 ? "OUT_OF_STOCK" : p.stock <= 3 ? "CRITICAL" : "LOW_STOCK",
    }));

  // Store Health Services Status
  const healthItems: SystemHealthItem[] = [
    {
      name: "Database (PostgreSQL)",
      status: "OPERATIONAL",
      detail: "Active connection pool OK",
    },
    {
      name: "Stripe Payments",
      status: process.env.STRIPE_SECRET_KEY ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: process.env.STRIPE_SECRET_KEY ? "SDK client ready" : "STRIPE_SECRET_KEY missing",
    },
    {
      name: "Stripe Webhooks",
      status: process.env.STRIPE_WEBHOOK_SECRET ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: process.env.STRIPE_WEBHOOK_SECRET ? "Signature verification enabled" : "STRIPE_WEBHOOK_SECRET missing",
    },
    {
      name: "Email Service",
      status: process.env.RESEND_API_KEY ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: process.env.RESEND_API_KEY ? "Resend API active" : "Dev console fallback",
    },
    {
      name: "Rate Limiter",
      status: process.env.UPSTASH_REDIS_REST_URL ? "OPERATIONAL" : "OPERATIONAL",
      detail: process.env.UPSTASH_REDIS_REST_URL ? "Upstash Redis active" : "Local sliding-window active",
    },
  ];

  const metrics = [
    {
      key: "sales" as const,
      label: "Sales",
      value: formatMoney(currentSales),
      change: percentageChange(currentSales, previousSales),
    },
    {
      key: "orders" as const,
      label: "Orders",
      value: String(currentOrders.length),
      change: percentageChange(currentOrders.length, previousOrders.length),
    },
    {
      key: "customers" as const,
      label: "New customers",
      value: String(currentCustomers.length),
      change: percentageChange(currentCustomers.length, previousCustomerCount),
    },
    {
      key: "average" as const,
      label: "Average order",
      value: formatMoney(currentAverage),
      change: percentageChange(currentAverage, previousAverage),
    },
    {
      key: "profit" as const,
      label: "Gross profit",
      value: formatMoney(currentSales - currentCost),
      change: percentageChange(
        currentSales - currentCost,
        previousSales - previousCost,
      ),
    },
    {
      key: "refunds" as const,
      label: "Refunded",
      value: formatMoney(currentRefunds),
      change: percentageChange(currentRefunds, previousRefunds),
    },
  ];

  const recentOrders: RecentOrder[] = [...currentOrders]
    .sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())
    .slice(0, 8)
    .map((order) => ({
      id: order.id,
      number: order.number,
      customer: order.customer,
      date: order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amountCents: order.totalCents,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: (order.status as RecentOrder["fulfillmentStatus"]) || "CONFIRMED",
    }));

  const exports = [
    "orders",
    "sales",
    "customers",
    ...(canManageCatalog ? ["inventory"] : []),
  ];

  const savedRows = liveMode && authorization
    ? await prisma.savedReport.findMany({
        where: { profileId: authorization.profile.id },
        orderBy: { updatedAt: "desc" },
        take: 20,
      })
    : [];

  const savedReports = savedRows.map((report) => {
    const filters = report.filters as {
      range?: string;
      from?: string;
      to?: string;
      timezone?: string;
      metric?: string;
    };
    return {
      id: report.id,
      name: report.name,
      href: `/admin?range=${filters.range ?? "30"}&timezone=${encodeURIComponent(filters.timezone ?? range.timeZone)}`,
    };
  });

  return (
    <AdminShell>
      <AdminDashboard
        role={role}
        liveMode={liveMode}
        range={range}
        chartMode={chartMode}
        metrics={metrics}
        chart={chart}
        actionItems={actionItems}
        recentOrders={recentOrders}
        topProducts={topProducts}
        inventoryAlerts={inventoryAlerts}
        healthItems={healthItems}
        canManageCatalog={canManageCatalog}
        canManageRoles={canManageRoles}
      />
      <SavedReportControls
        liveMode={liveMode}
        reports={savedReports}
        filters={{
          range: (range.key as "7" | "30" | "90" | "custom") || "30",
          from: range.from.toISOString().slice(0, 10),
          to: range.to.toISOString().slice(0, 10),
          timezone: range.timeZone,
          metric: chartMode,
        }}
      />
    </AdminShell>
  );
}

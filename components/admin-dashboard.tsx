"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  PackageCheck,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { DashboardRange } from "../lib/admin-analytics";
import { dashboardTimeZones } from "../lib/admin-analytics";
import type { AppRole } from "../lib/permissions";
import { formatMoney } from "../lib/products";

export type Metric = {
  key: "sales" | "orders" | "customers" | "average" | "profit" | "refunds";
  label: string;
  value: string;
  change: number | null;
};

export type ChartPoint = {
  key: string;
  label: string;
  fullLabel: string;
  revenueCents: number;
  orders: number;
};

export type ActionItem = {
  key: string;
  label: string;
  count: number;
  detail: string;
  href: string;
  tone: "critical" | "warning" | "info";
};

export type RecentOrder = {
  id: string;
  number: string;
  customer: string;
  date: string;
  amountCents: number;
  paymentStatus: "PAID" | "PENDING" | "DECLINED" | "REFUNDED";
  fulfillmentStatus: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
};

export type TopProduct = {
  id: string;
  name: string;
  image: string;
  unitsSold: number;
  revenueCents: number;
  stock: number;
};

export type InventoryAlert = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  level: "OUT_OF_STOCK" | "CRITICAL" | "LOW_STOCK";
};

export type SystemHealthItem = {
  name: string;
  status: "OPERATIONAL" | "WARNING" | "DEGRADED" | "CRITICAL" | "NOT_CONFIGURED";
  detail: string;
};

export type DashboardProps = {
  role: AppRole;
  liveMode: boolean;
  range: DashboardRange;
  chartMode: "revenue" | "orders";
  metrics: Metric[];
  chart: ChartPoint[];
  actionItems: ActionItem[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  inventoryAlerts: InventoryAlert[];
  healthItems: SystemHealthItem[];
  canManageCatalog: boolean;
  canManageRoles: boolean;
};

const metricIcons = {
  sales: CircleDollarSign,
  orders: ShoppingCart,
  customers: UsersRound,
  average: TrendingUp,
  profit: WalletCards,
  refunds: RotateCcw,
};

function changeLabel(change: number | null) {
  if (change === null)
    return { text: "New this period", direction: "up" as const };
  if (Math.abs(change) < 0.05)
    return { text: "No change", direction: "flat" as const };
  return {
    text: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    direction: change > 0 ? ("up" as const) : ("down" as const),
  };
}

export function AdminDashboard(props: DashboardProps) {
  const chartMode = props.chartMode;
  const rangeQuery =
    props.range.key === "custom"
      ? `range=custom&from=${props.range.from.toISOString().slice(0, 10)}&to=${props.range.to.toISOString().slice(0, 10)}`
      : `range=${props.range.key}`;
  const chartMaximum = Math.max(
    ...props.chart.map((point) =>
      chartMode === "revenue" ? point.revenueCents : point.orders,
    ),
    1,
  );
  const chartTotal = props.chart.reduce(
    (sum, point) =>
      sum + (chartMode === "revenue" ? point.revenueCents : point.orders),
    0,
  );

  const totalUrgentActions = props.actionItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="compact-command-center">
      {/* ─── Compact Header (~70px height) ────────────────────────── */}
      <div className="compact-dashboard-header">
        <div className="header-left">
          <span className="eyebrow-tag">COMMAND CENTER</span>
          <h1>Store Overview</h1>
          <span className="dashboard-sub">Monitor sales, orders, inventory, and operational health.</span>
        </div>

        <div className="header-right">
          <span className={`env-pill ${props.liveMode ? "live" : "dev"}`}>
            <span className="env-dot" />
            {props.liveMode ? "PRODUCTION" : "DEVELOPMENT"}
          </span>

          <div className="compact-preset-group">
            {["7", "30", "90"].map((days) => (
              <Link
                className={`preset-btn ${props.range.key === days ? "active" : ""}`}
                href={`/admin?range=${days}&timezone=${encodeURIComponent(props.range.timeZone)}`}
                key={days}
              >
                {days}d
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ROW 1: Compact 6-Metric KPI Row (~130px height) ───────── */}
      <div className="kpi-row-6col">
        {props.metrics.map((metric) => {
          const Icon = metricIcons[metric.key];
          const change = changeLabel(metric.change);
          return (
            <div className="kpi-card-compact" key={metric.key}>
              <div className="kpi-top">
                <span className="kpi-label">{metric.label}</span>
                <Icon size={15} className="kpi-icon" />
              </div>
              <strong className="kpi-val">{metric.value}</strong>
              <div className="kpi-footer">
                <small className={`kpi-change ${change.direction}`}>
                  {change.direction === "up" ? "↗ " : change.direction === "down" ? "↘ " : ""}
                  {change.text}
                </small>
                <span className="kpi-subtext">vs prev period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ROW 2: Horizontal Action Required Strip (~140px height) ── */}
      <section className="action-required-strip-container">
        <div className="strip-header">
          <h2>Action Required</h2>
          {totalUrgentActions > 0 ? (
            <span className="strip-badge danger">{totalUrgentActions} urgent</span>
          ) : (
            <span className="strip-badge success">All caught up</span>
          )}
        </div>

        <div className="action-strip-5col">
          {props.actionItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`action-tile ${item.tone} ${item.count > 0 ? "has-count" : "empty"}`}
            >
              <div className="tile-top">
                <span className="tile-count">{item.count}</span>
                <ChevronRight size={14} className="tile-arrow" />
              </div>
              <strong className="tile-label">{item.label}</strong>
              <small className="tile-detail">{item.detail}</small>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── ROW 3: 70/30 Split — Revenue Chart & Store Health ────── */}
      <div className="grid-70-30">
        {/* Left (70%): Revenue Performance Chart */}
        <section className="admin-card compact-chart-card">
          <div className="card-heading-compact">
            <div>
              <span className="eyebrow-mini">PERFORMANCE</span>
              <h3>{chartMode === "revenue" ? "Revenue Trajectory" : "Order Volume"}</h3>
            </div>
            <div className="chart-ctrls">
              <div className="toggle-pill">
                <Link
                  className={chartMode === "revenue" ? "active" : ""}
                  href={`/admin?${rangeQuery}&metric=revenue`}
                >
                  Revenue
                </Link>
                <Link
                  className={chartMode === "orders" ? "active" : ""}
                  href={`/admin?${rangeQuery}&metric=orders`}
                >
                  Orders
                </Link>
              </div>
              <strong className="chart-total-val">
                {chartMode === "revenue" ? formatMoney(chartTotal) : chartTotal}
              </strong>
            </div>
          </div>

          <div
            className="compact-sales-chart"
            role="img"
            aria-label={`${chartMode === "revenue" ? "Revenue" : "Orders"} performance chart.`}
          >
            {props.chart.map((point) => {
              const value =
                chartMode === "revenue" ? point.revenueCents : point.orders;
              const height =
                value === 0
                  ? 0
                  : Math.max(6, Math.round((value / chartMaximum) * 100));
              const displayValue =
                chartMode === "revenue" ? formatMoney(value) : String(value);
              return (
                <div
                  className="compact-chart-col"
                  key={point.key}
                  title={`${point.fullLabel}: ${displayValue}`}
                >
                  <span className="chart-val">{displayValue}</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="chart-lbl">{point.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right (30%): Compact Store Health Panel */}
        <section className="admin-card compact-health-card">
          <div className="card-heading-compact">
            <div>
              <span className="eyebrow-mini">INFRASTRUCTURE</span>
              <h3>Store Health</h3>
            </div>
            <span className="health-live-dot" title="Live status check" />
          </div>

          <div className="health-rows-list">
            {props.healthItems.map((item) => (
              <div key={item.name} className="health-row-item">
                <div className="health-left">
                  <span className={`health-status-dot ${item.status.toLowerCase()}`} />
                  <span className="health-name">{item.name}</span>
                </div>
                <div className="health-right">
                  <span className={`health-badge ${item.status.toLowerCase()}`}>
                    {item.status === "OPERATIONAL" ? "Operational" : item.status === "NOT_CONFIGURED" ? "Not Configured" : item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── ROW 4: Recent Orders Compact Table ─────────────────────── */}
      <section className="admin-card compact-orders-card">
        <div className="card-heading-compact">
          <div>
            <span className="eyebrow-mini">FULFILMENT</span>
            <h3>Recent Orders</h3>
          </div>
          <Link href="/admin/orders" className="text-link-compact">
            View all orders →
          </Link>
        </div>

        <div className="table-scroll">
          <table className="compact-data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment Status</th>
                <th>Fulfillment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {props.recentOrders.length ? (
                props.recentOrders.slice(0, 6).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.number}</strong>
                    </td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>{formatMoney(order.amountCents)}</td>
                    <td>
                      <span
                        className={`badge-compact payment-${order.paymentStatus.toLowerCase()}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-compact fulfillment-${order.fulfillmentStatus.toLowerCase()}`}
                      >
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                    <td>
                      <Link href="/admin/orders" className="action-link-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center muted-text">
                    No recent orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── ROW 5: 50/50 Split — Top Products & Inventory Alerts ───── */}
      <div className="grid-50-50">
        {/* Left (50%): Top Products */}
        <section className="admin-card compact-products-card">
          <div className="card-heading-compact">
            <div>
              <span className="eyebrow-mini">CATALOG</span>
              <h3>Top Products</h3>
            </div>
            <Link href="/admin/products" className="text-link-compact">
              View catalog →
            </Link>
          </div>

          <div className="compact-product-rows">
            {props.topProducts.length ? (
              props.topProducts.slice(0, 4).map((product, index) => (
                <div key={product.id} className="compact-product-row">
                  <span className="product-rank">#{index + 1}</span>
                  <div
                    className="product-mini-thumb"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                  <div className="product-meta">
                    <strong>{product.name}</strong>
                    <small>{product.unitsSold} sold · {product.stock} left</small>
                  </div>
                  <strong className="product-rev">{formatMoney(product.revenueCents)}</strong>
                </div>
              ))
            ) : (
              <p className="dashboard-empty-sm">No product sales yet.</p>
            )}
          </div>
        </section>

        {/* Right (50%): Inventory Alerts */}
        <section className="admin-card compact-inventory-card">
          <div className="card-heading-compact">
            <div>
              <span className="eyebrow-mini">STOCK MONITOR</span>
              <h3>Inventory Alerts</h3>
            </div>
            <Link href="/admin/inventory" className="text-link-compact">
              Manage stock →
            </Link>
          </div>

          <div className="compact-inventory-rows">
            {props.inventoryAlerts.length ? (
              props.inventoryAlerts.slice(0, 4).map((alert) => (
                <Link
                  key={alert.id}
                  href="/admin/inventory"
                  className={`compact-inventory-row ${alert.level.toLowerCase()}`}
                >
                  <div className="inventory-meta">
                    <strong>{alert.name}</strong>
                    <small>SKU: {alert.sku}</small>
                  </div>
                  <span className="inventory-badge">
                    {alert.level === "OUT_OF_STOCK"
                      ? "OUT OF STOCK"
                      : `${alert.stock} left`}
                  </span>
                </Link>
              ))
            ) : (
              <div className="inventory-healthy-banner">
                <PackageCheck size={22} />
                <span>Inventory is healthy. No items require attention.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

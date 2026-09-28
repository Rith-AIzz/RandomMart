import Link from "next/link";
import {
  Bell,
  Boxes,
  ClipboardList,
  FolderTree,
  Gauge,
  HelpCircle,
  LogOut,
  MessageSquare,
  PackageSearch,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  User,
  UsersRound,
  Warehouse,
  BarChart2,
  ChevronDown,
} from "lucide-react";
import { isLiveMode } from "../lib/runtime-config";
import {
  hasPermission,
  type AppPermission,
  type AppRole,
} from "../lib/permissions";
import { getCurrentProfile } from "../services/authorization.service";
import { prisma } from "../lib/prisma/client";

type NavItem = {
  icon: typeof Gauge;
  label: string;
  href: string;
  permission: AppPermission;
  badgeKey?: "orders" | "inventory" | "reviews";
};

type NavGroup = {
  section: string;
  items: ReadonlyArray<NavItem>;
};

const navGroups: ReadonlyArray<NavGroup> = [
  {
    section: "OVERVIEW",
    items: [
      { icon: Gauge, label: "Dashboard", href: "/admin", permission: "admin.access" },
    ],
  },
  {
    section: "CATALOG",
    items: [
      { icon: Boxes, label: "Products", href: "/admin/products", permission: "catalog.manage" },
      { icon: FolderTree, label: "Categories", href: "/admin/categories", permission: "catalog.manage" },
      { icon: Warehouse, label: "Inventory", href: "/admin/inventory", permission: "catalog.manage", badgeKey: "inventory" },
    ],
  },
  {
    section: "SALES",
    items: [
      { icon: ShoppingCart, label: "Orders", href: "/admin/orders", permission: "orders.manage", badgeKey: "orders" },
      { icon: UsersRound, label: "Customers", href: "/admin/customers", permission: "customers.read" },
    ],
  },
  {
    section: "ENGAGEMENT",
    items: [
      { icon: MessageSquare, label: "Reviews", href: "/admin/reviews", permission: "catalog.manage", badgeKey: "reviews" },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { icon: BarChart2, label: "Reports", href: "/admin/reports", permission: "admin.access" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { icon: ClipboardList, label: "Audit Log", href: "/admin/audit", permission: "audit.read" },
      { icon: Settings, label: "Settings", href: "/admin/settings", permission: "admin.access" },
    ],
  },
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const liveMode = isLiveMode();
  let role: AppRole = "ADMIN";
  let userEmail = "admin@randommart.example";
  let userName = "Administrator";

  let pendingOrdersCount = 0;
  let lowStockCount = 0;
  let unapprovedReviewsCount = 0;

  if (liveMode) {
    try {
      const current = await getCurrentProfile();
      role = current.profile.role as AppRole;
      userEmail = current.profile.email;
      userName = current.profile.fullName || userEmail.split("@")[0];

      const [pendingOrders, lowStock, unapprovedReviews] = await Promise.all([
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.product.count({ where: { isActive: true, stockQuantity: { lte: 10 } } }),
        prisma.review.count({ where: { isApproved: false } }),
      ]);
      pendingOrdersCount = pendingOrders;
      lowStockCount = lowStock;
      unapprovedReviewsCount = unapprovedReviews;
    } catch {
      role = "ADMIN";
    }
  } else {
    pendingOrdersCount = 4;
    lowStockCount = 3;
    unapprovedReviewsCount = 2;
  }

  const badgeCounts = {
    orders: pendingOrdersCount,
    inventory: lowStockCount,
    reviews: unapprovedReviewsCount,
  };

  const totalNotifications = pendingOrdersCount + lowStockCount + unapprovedReviewsCount;

  return (
    <main className="admin-app-shell">
      {/* 64px Application Top Bar */}
      <header className="admin-top-bar">
        <div className="admin-top-left">
          <Link href="/admin" className="admin-top-brand">
            <span className="wordmark wordmark-light">RandomMart</span>
            <span className="admin-top-tag">ADMIN</span>
          </Link>
        </div>

        <div className="admin-top-search">
          <Search size={16} />
          <input
            type="search"
            name="q"
            placeholder="Search orders, products, customers..."
            aria-label="Global Admin Search"
          />
        </div>

        <div className="admin-top-right">
          <a
            href="mailto:support@randommart.example"
            className="admin-top-btn"
            title="Help & Support"
          >
            <HelpCircle size={18} />
            <span>Help</span>
          </a>

          <div className="admin-notif-trigger" title="Notifications">
            <Bell size={18} />
            {totalNotifications > 0 && (
              <span className="notif-badge">{totalNotifications}</span>
            )}
          </div>

          <div className="admin-profile-pill">
            <div className="admin-avatar-icon">
              <User size={15} />
            </div>
            <div className="admin-profile-meta">
              <strong>{userName}</strong>
              <small>{role}</small>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </div>
        </div>
      </header>

      <div className="admin-body">
        {/* 240–260px Navy Application Sidebar */}
        <aside className="admin-sidebar">
          <nav aria-label="Administrator navigation">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) =>
                hasPermission(role, item.permission),
              );
              if (!visibleItems.length) return null;
              return (
                <div key={group.section} className="admin-nav-group">
                  <span className="admin-nav-label">{group.section}</span>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const badgeVal = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
                    return (
                      <Link href={item.href} key={item.href} className="admin-nav-item">
                        <Icon size={18} />
                        <span className="nav-item-label">{item.label}</span>
                        {badgeVal > 0 && (
                          <span className="nav-item-badge">{badgeVal}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="admin-sidebar-footer">
            <Link href="/products" className="return-store-link">
              <PackageSearch size={17} /> Return to Store
            </Link>
          </div>
        </aside>

        {/* Main Application Workspace */}
        <section className="admin-main-workspace">
          <div className="admin-workspace-inner">{children}</div>
        </section>
      </div>
    </main>
  );
}

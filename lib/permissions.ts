export type AppRole = "CUSTOMER" | "SUPPORT" | "MANAGER" | "ADMIN";
export type AppPermission =
  | "admin.access"
  | "catalog.manage"
  | "orders.manage"
  | "customers.read"
  | "audit.read"
  | "roles.manage";

const rolePermissions: Record<AppRole, readonly AppPermission[]> = {
  CUSTOMER: [],
  SUPPORT: ["admin.access", "orders.manage", "customers.read"],
  MANAGER: [
    "admin.access",
    "catalog.manage",
    "orders.manage",
    "customers.read",
  ],
  ADMIN: [
    "admin.access",
    "catalog.manage",
    "orders.manage",
    "customers.read",
    "audit.read",
    "roles.manage",
  ],
};

export function hasPermission(role: AppRole, permission: AppPermission) {
  return rolePermissions[role].includes(permission);
}

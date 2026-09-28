import { redirect } from "next/navigation";
import { isLiveMode } from "../../lib/runtime-config";
import { ApplicationError } from "../../lib/application-error";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLiveMode()) {
    const { requirePermission } =
      await import("../../services/authorization.service");
    try {
      await requirePermission("admin.access");
    } catch (cause) {
      redirect(
        cause instanceof ApplicationError &&
          cause.code === "AUTHENTICATION_REQUIRED"
          ? "/login?returnTo=/admin"
          : "/",
      );
    }
  }
  return children;
}

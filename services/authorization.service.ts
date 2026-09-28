import { createClient } from "../lib/supabase/server";
import { prisma } from "../lib/prisma/client";
import { ApplicationError } from "../lib/application-error";
import {
  hasPermission,
  type AppPermission,
  type AppRole,
} from "../lib/permissions";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new ApplicationError(
      "AUTHENTICATION_REQUIRED",
      401,
      "Please sign in to continue.",
    );
  return data.user;
}

export async function getCurrentProfile() {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, fullName: true, role: true },
  });
  if (!profile)
    throw new ApplicationError(
      "PROFILE_NOT_FOUND",
      404,
      "Your account profile was not found.",
    );
  return { user, profile };
}

export async function requirePermission(permission: AppPermission) {
  const context = await getCurrentProfile();
  if (!hasPermission(context.profile.role as AppRole, permission)) {
    throw new ApplicationError(
      "ACCESS_DENIED",
      403,
      "You do not have permission to perform this action.",
    );
  }
  return context;
}

export async function requireAdmin() {
  return requirePermission("roles.manage");
}

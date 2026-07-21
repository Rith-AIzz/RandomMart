import { createClient } from "../lib/supabase/server";
import { prisma } from "../lib/prisma/client";
export async function requireUser() { const supabase = await createClient(); const { data, error } = await supabase.auth.getUser(); if (error || !data.user) throw new Error("AUTHENTICATION_REQUIRED"); return data.user; }
export async function requireAdmin() { const user = await requireUser(); const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } }); if (profile?.role !== "ADMIN") throw new Error("ACCESS_DENIED"); return user; }

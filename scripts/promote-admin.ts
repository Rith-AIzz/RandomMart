import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

const email = process.env.ADMIN_EMAIL;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const directUrl = process.env.DIRECT_URL;
if (!email || !url || !serviceRole || !directUrl)
  throw new Error(
    "ADMIN_EMAIL, Supabase variables, and DIRECT_URL are required.",
  );
const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: directUrl }),
});
const { data, error } = await supabase.auth.admin.listUsers();
if (error) throw error;
const user = data.users.find(
  (candidate) =>
    candidate.email?.toLowerCase() === email.toLowerCase() &&
    candidate.email_confirmed_at,
);
if (!user)
  throw new Error("A verified Supabase user with ADMIN_EMAIL was not found.");
await prisma.profile.update({
  where: { id: user.id },
  data: { role: "ADMIN" },
});
await prisma.$disconnect();
console.log("Verified user promoted to ADMIN.");

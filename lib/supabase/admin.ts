import { createClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseConfig,
  getServerSupabaseSecret,
} from "../runtime-config";

export function createAdminClient() {
  const config = getPublicSupabaseConfig();
  const secret = getServerSupabaseSecret();
  if (!config || !secret)
    throw new Error(
      "Server-only Supabase administration variables are required.",
    );
  return createClient(config.url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

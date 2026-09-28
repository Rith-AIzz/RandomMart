import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "../runtime-config";

export function createClient() {
  const config = getPublicSupabaseConfig();
  if (!config)
    throw new Error("Public Supabase environment variables are required.");
  return createBrowserClient(config.url, config.key);
}

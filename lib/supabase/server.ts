import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "../runtime-config";

export async function createClient() {
  const cookieStore = await cookies();
  const config = getPublicSupabaseConfig();
  if (!config)
    throw new Error("Public Supabase environment variables are required.");
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Components cannot always write refreshed cookies. */
        }
      },
    },
  });
}

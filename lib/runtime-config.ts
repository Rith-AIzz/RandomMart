const nonEmpty = (value: string | undefined) => value?.trim() || undefined;

export function getPublicSupabaseConfig() {
  const url = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = nonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return url && key ? { url, key } : null;
}

export function getServerSupabaseSecret() {
  return nonEmpty(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isDatabaseConfigured() {
  return Boolean(nonEmpty(process.env.DATABASE_URL));
}

export function isLiveMode() {
  return Boolean(getPublicSupabaseConfig() && isDatabaseConfigured());
}

export function getSiteUrl() {
  return nonEmpty(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:5173";
}

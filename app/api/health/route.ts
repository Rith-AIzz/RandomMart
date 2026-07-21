export async function GET() { return Response.json({ status: "ok", service: "randommart", demoMode: !process.env.NEXT_PUBLIC_SUPABASE_URL }, { headers: { "Cache-Control": "no-store" } }); }

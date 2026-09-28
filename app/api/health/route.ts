import { isLiveMode } from "../../../lib/runtime-config";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "randommart",
      mode: isLiveMode() ? "live" : "preview",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

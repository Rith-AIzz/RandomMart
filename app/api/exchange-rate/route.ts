import { NextResponse } from "next/server";
const FALLBACK_RATE = 4050;
export async function GET() {
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/providers/nbc/rate/usd/khr", { next: { revalidate: 21600 } });
    if (!response.ok) throw new Error("RATE_PROVIDER_ERROR");
    const data = await response.json();
    const rate = Number(data.rate);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("INVALID_RATE");
    return NextResponse.json({ base: "USD", quote: "KHR", rate, source: "National Bank of Cambodia via Frankfurter", fallback: false });
  } catch {
    return NextResponse.json({ base: "USD", quote: "KHR", rate: FALLBACK_RATE, source: "RandomMart fallback", fallback: true });
  }
}

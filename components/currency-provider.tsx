"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Currency = "USD" | "KHR";
type CurrencyContextValue = { currency: Currency; rate: number; setCurrency: (currency: Currency) => void; format: (usdCents: number) => string };
const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const FALLBACK_RATE = 4050;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [rate, setRate] = useState(FALLBACK_RATE);
  useEffect(() => {
    const saved = localStorage.getItem("randommart-currency");
    if (saved === "KHR") setCurrencyState("KHR");
    fetch("/api/exchange-rate").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { if (Number.isFinite(data.rate) && data.rate > 0) setRate(data.rate); }).catch(() => {});
  }, []);
  const setCurrency = (next: Currency) => { setCurrencyState(next); localStorage.setItem("randommart-currency", next); };
  const format = (usdCents: number) => currency === "KHR"
    ? new Intl.NumberFormat("km-KH", { style: "currency", currency: "KHR", maximumFractionDigits: 0 }).format((usdCents / 100) * rate)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usdCents / 100);
  return <CurrencyContext.Provider value={{ currency, rate, setCurrency, format }}>{children}</CurrencyContext.Provider>;
}
export function useCurrency() { const value = useContext(CurrencyContext); if (!value) throw new Error("useCurrency must be used within CurrencyProvider"); return value; }

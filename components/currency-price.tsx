"use client";
import { useCurrency } from "./currency-provider";
export function CurrencyPrice({ cents }: { cents: number }) { const { format } = useCurrency(); return <>{format(cents)}</>; }

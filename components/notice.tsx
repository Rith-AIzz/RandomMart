"use client";

import { CheckCircle2 } from "lucide-react";
import { useStore } from "./store-provider";

export function Notice() {
  const { notice } = useStore();
  return (
    <div
      className={`toast ${notice ? "toast-visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 size={19} />
      {notice}
    </div>
  );
}

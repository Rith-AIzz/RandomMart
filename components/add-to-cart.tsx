"use client";

import { ShoppingBag } from "lucide-react";
import { useStore } from "./store-provider";

export function AddToCart({
  productId,
  disabled = false,
  label = "Add to cart",
  className = "button button-primary",
}: {
  productId: string;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const { addItem, hydrated } = useStore();
  return (
    <button
      type="button"
      className={className}
      disabled={disabled || !hydrated}
      aria-busy={!hydrated}
      onClick={() => addItem(productId)}
    >
      <ShoppingBag size={18} aria-hidden="true" />
      {disabled ? "Out of stock" : label}
    </button>
  );
}

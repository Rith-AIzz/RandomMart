"use client";
import { Heart } from "lucide-react";
import { useStore } from "./store-provider";
export function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { wishlist, toggleWishlist } = useStore();
  const saved = wishlist.includes(productId);
  return (
    <button
      type="button"
      className={`wishlist-button ${className}`}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      onClick={() => toggleWishlist(productId)}
    >
      <Heart size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

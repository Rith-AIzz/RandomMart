"use client";

import { Heart } from "lucide-react";
import { useStore } from "./store-provider";

export function WishlistButton({ productId, productName }: { productId: string; productName: string }) {
  const { isWishlisted, toggleWishlist } = useStore();
  const saved = isWishlisted(productId);
  return <button type="button" className="icon-button wishlist-button" aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`} aria-pressed={saved} onClick={() => toggleWishlist(productId)}><Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" /></button>;
}

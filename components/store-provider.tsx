"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { calculateTotals, type CartLine } from "../lib/commerce";
import { productById } from "../lib/products";

export type DemoOrder = {
  id: string;
  number: string;
  createdAt: string;
  status: "CONFIRMED" | "PROCESSING" | "SHIPPED";
  lines: CartLine[];
  totalCents: number;
  address: string;
};

type DemoUser = { name: string; email: string };

type StoreContextValue = {
  cart: CartLine[];
  cartCount: number;
  totals: ReturnType<typeof calculateTotals>;
  orders: DemoOrder[];
  user: DemoUser | null;
  notice: string | null;
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  placeOrder: (address: string) => DemoOrder;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setCart(JSON.parse(localStorage.getItem("randommart-cart") ?? "[]"));
        setOrders(JSON.parse(localStorage.getItem("randommart-orders") ?? "[]"));
        setUser(JSON.parse(localStorage.getItem("randommart-user") ?? "null"));
        setWishlist(JSON.parse(localStorage.getItem("randommart-wishlist") ?? "[]"));
      } catch {
        localStorage.removeItem("randommart-cart");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("randommart-cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("randommart-orders", JSON.stringify(orders));
  }, [orders, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("randommart-wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (user) localStorage.setItem("randommart-user", JSON.stringify(user));
    else localStorage.removeItem("randommart-user");
  }, [user, hydrated]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const addItem = (productId: string, quantity = 1) => {
    const product = productById(productId);
    if (!product || product.stock < 1) return showNotice("This item is currently unavailable.");
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) return current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) } : line);
      return [...current, { productId, quantity: Math.min(product.stock, quantity) }];
    });
    showNotice(`${product.name} added to your cart.`);
  };

  const setQuantity = (productId: string, quantity: number) => {
    const product = productById(productId);
    if (!product) return;
    if (quantity < 1) return removeItem(productId);
    setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(product.stock, Math.floor(quantity)) } : line));
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);
  const toggleWishlist = (productId: string) => {
    const product = productById(productId);
    if (!product) return;
    setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
    showNotice(wishlist.includes(productId) ? `${product.name} removed from your wishlist.` : `${product.name} saved to your wishlist.`);
  };

  const removeItem = (productId: string) => setCart((current) => current.filter((line) => line.productId !== productId));
  const clearCart = () => setCart([]);

  const linesWithProducts = cart.flatMap((line) => {
    const product = productById(line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const totals = calculateTotals(linesWithProducts);

  const signIn = (email: string, name = "Darith") => {
    setUser({ email, name });
    showNotice("Welcome back to RandomMart.");
  };
  const signOut = () => {
    setUser(null);
    showNotice("You have been signed out.");
  };

  const placeOrder = (address: string) => {
    if (!cart.length) throw new Error("Your cart is empty.");
    const order: DemoOrder = {
      id: crypto.randomUUID(),
      number: `RM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: "CONFIRMED",
      lines: cart,
      totalCents: totals.totalCents,
      address,
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    showNotice(`Order ${order.number} confirmed.`);
    return order;
  };

  const value = { cart, cartCount: cart.reduce((sum, line) => sum + line.quantity, 0), totals, orders, user, notice, wishlist, isWishlisted, toggleWishlist, addItem, setQuantity, removeItem, clearCart, signIn, signOut, placeOrder };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}

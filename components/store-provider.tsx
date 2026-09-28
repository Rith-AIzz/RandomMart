"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { calculateTotals, type CartLine } from "../lib/commerce";
import { productById } from "../lib/products";
import { products as sampleProducts, type Product } from "../lib/products";

export type StoreOrder = {
  id: string;
  number: string;
  createdAt: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  lines: Array<
    CartLine & {
      name?: string;
      sku?: string;
      image?: string;
      unitPriceCents?: number;
      lineTotalCents?: number;
    }
  >;
  totalCents: number;
  address: string;
};

export type StoreUser = {
  id?: string;
  name: string;
  email: string;
  role?: "CUSTOMER" | "SUPPORT" | "MANAGER" | "ADMIN";
};
export type DeliveryInput = {
  name: string;
  line1: string;
  city: string;
  country: string;
};

type StoreContextValue = {
  cart: CartLine[];
  cartCount: number;
  totals: ReturnType<typeof calculateTotals>;
  orders: StoreOrder[];
  user: StoreUser | null;
  liveMode: boolean;
  hydrated: boolean;
  products: Product[];
  notice: string | null;
  wishlist: string[];
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  placeOrder: (
    delivery: DeliveryInput,
    paymentMethod: "CASH_ON_DELIVERY" | "TEST_CARD",
  ) => Promise<StoreOrder>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  children,
  initialUser = null,
  liveMode = false,
  catalogProducts = sampleProducts,
}: {
  children: React.ReactNode;
  initialUser?: StoreUser | null;
  liveMode?: boolean;
  catalogProducts?: Product[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<StoreUser | null>(initialUser);
  const [notice, setNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setCart(parseStoredCart(localStorage.getItem("randommart-cart")));
        setWishlist(
          parseStoredWishlist(localStorage.getItem("randommart-wishlist")),
        );
        if (!liveMode) {
          setOrders(
            parseStoredOrders(localStorage.getItem("randommart-orders")),
          );
          setUser(parseStoredUser(localStorage.getItem("randommart-user")));
        }
      } catch {
        localStorage.removeItem("randommart-cart");
        localStorage.removeItem("randommart-orders");
        localStorage.removeItem("randommart-user");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [liveMode]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("randommart-cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem("randommart-wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated && !liveMode)
      localStorage.setItem("randommart-orders", JSON.stringify(orders));
  }, [orders, hydrated, liveMode]);
  useEffect(() => {
    if (!hydrated || liveMode) return;
    if (user) localStorage.setItem("randommart-user", JSON.stringify(user));
    else localStorage.removeItem("randommart-user");
  }, [user, hydrated, liveMode]);

  useEffect(() => {
    if (
      !hydrated ||
      !liveMode ||
      !user?.id ||
      mergedForUser.current === user.id
    )
      return;
    mergedForUser.current = user.id;
    void requestJson<{ lines: CartLine[] }>("/api/cart", {
      method: "POST",
      body: JSON.stringify({ lines: cart }),
      headers: { "Content-Type": "application/json" },
    })
      .then(({ lines }) => setCart(lines))
      .catch((cause) => showNotice(errorMessage(cause)));
    void requestJson<{ orders: Array<Record<string, unknown>> }>("/api/orders")
      .then(({ orders }) => setOrders(orders.map(mapApiOrder)))
      .catch((cause) => showNotice(errorMessage(cause)));
  }, [cart, hydrated, liveMode, user?.id]);

  useEffect(() => {
    if (!hydrated || !liveMode || !user?.id) return;
    void requestJson<{ productIds: string[] }>("/api/wishlist")
      .then(({ productIds }) => setWishlist(productIds))
      .catch((cause) => showNotice(errorMessage(cause)));
  }, [hydrated, liveMode, user?.id]);

  const addItem = (productId: string, quantity = 1) => {
    const product =
      catalogProducts.find((item) => item.id === productId) ??
      productById(productId);
    if (!product || product.stock < 1)
      return showNotice("This item is currently unavailable.");
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      const nextQuantity = Math.min(
        product.stock,
        (existing?.quantity ?? 0) + quantity,
      );
      if (liveMode && user?.id)
        void persistCartLine(productId, nextQuantity, showNotice);
      const next = existing
        ? current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: nextQuantity }
              : line,
          )
        : [...current, { productId, quantity: nextQuantity }];
      persistGuestCart(next);
      return next;
    });
    showNotice(`${product.name} added to your cart.`);
  };

  const setQuantity = (productId: string, quantity: number) => {
    const product =
      catalogProducts.find((item) => item.id === productId) ??
      productById(productId);
    if (!product) return;
    if (quantity < 1) return removeItem(productId);
    const nextQuantity = Math.min(product.stock, Math.floor(quantity));
    setCart((current) => {
      const next = current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: nextQuantity }
          : line,
      );
      persistGuestCart(next);
      return next;
    });
    if (liveMode && user?.id)
      void persistCartLine(productId, nextQuantity, showNotice);
  };

  const removeItem = (productId: string) => {
    setCart((current) => {
      const next = current.filter((line) => line.productId !== productId);
      persistGuestCart(next);
      return next;
    });
    if (liveMode && user?.id) void persistCartLine(productId, 0, showNotice);
  };
  const clearCart = () => {
    setCart([]);
    persistGuestCart([]);
    if (liveMode && user?.id)
      void requestJson("/api/cart", { method: "DELETE" }).catch((cause) =>
        showNotice(errorMessage(cause)),
      );
  };
  const toggleWishlist = (productId: string) =>
    setWishlist((current) => {
      const saved = current.includes(productId);
      const next = saved
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      if (liveMode && user?.id)
        void requestJson("/api/wishlist", {
          method: saved ? "DELETE" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }).catch((cause) => showNotice(errorMessage(cause)));
      return next;
    });

  const linesWithProducts = cart.flatMap((line) => {
    const product =
      catalogProducts.find((item) => item.id === line.productId) ??
      productById(line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const totals = calculateTotals(linesWithProducts);

  const signIn = async (email: string, password: string) => {
    if (liveMode) {
      const { createClient } = await import("../lib/supabase/client");
      const { data, error } = await createClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user)
        throw new Error(error?.message ?? "Unable to sign in.");
      setUser({
        id: data.user.id,
        email: data.user.email ?? email,
        name: String(data.user.user_metadata.full_name ?? email.split("@")[0]),
      });
    } else {
      const sampleUser = { email, name: email.split("@")[0] || "Customer" };
      setUser(sampleUser);
      localStorage.setItem("randommart-user", JSON.stringify(sampleUser));
    }
    showNotice("Welcome back to RandomMart.");
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (liveMode) {
      const { createClient } = await import("../lib/supabase/client");
      const { data, error } = await createClient().auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw new Error(error.message);
      if (data.user && data.session) setUser({ id: data.user.id, email, name });
      showNotice(
        data.session
          ? "Your account is ready."
          : "Check your email to confirm your account.",
      );
      return;
    }
    setUser({ email, name });
    localStorage.setItem("randommart-user", JSON.stringify({ email, name }));
    showNotice("Your local account is ready.");
  };

  const signOut = async () => {
    if (liveMode) {
      const { createClient } = await import("../lib/supabase/client");
      const { error } = await createClient().auth.signOut();
      if (error) throw new Error(error.message);
    }
    setUser(null);
    showNotice("You have been signed out.");
  };

  const placeOrder = async (
    delivery: DeliveryInput,
    paymentMethod: "CASH_ON_DELIVERY" | "TEST_CARD",
  ) => {
    if (!cart.length) throw new Error("Your cart is empty.");
    if (liveMode) {
      const { order } = await requestJson<{ order: Record<string, unknown> }>(
        "/api/orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            delivery,
            paymentMethod,
            simulatedOutcome: "APPROVED",
          }),
        },
      );
      const mapped = mapApiOrder(order);
      setOrders((current) => [mapped, ...current]);
      setCart([]);
      showNotice(`Order ${mapped.number} confirmed.`);
      return mapped;
    }
    const order: StoreOrder = {
      id: crypto.randomUUID(),
      number: `RM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: "CONFIRMED",
      lines: cart,
      totalCents: totals.totalCents,
      address: `${delivery.line1}, ${delivery.city}, ${delivery.country}`,
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    showNotice(`Order ${order.number} confirmed.`);
    return order;
  };

  const value = {
    cart,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    totals,
    orders,
    user,
    notice,
    wishlist,
    liveMode,
    hydrated,
    products: catalogProducts,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    toggleWishlist,
    signIn,
    signUp,
    signOut,
    placeOrder,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin" });
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok)
    throw new Error(
      typeof data.message === "string" ? data.message : "The request failed.",
    );
  return data as T;
}

function persistGuestCart(lines: CartLine[]) {
  localStorage.setItem("randommart-cart", JSON.stringify(lines));
}

const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Unable to update the store.";

async function persistCartLine(
  productId: string,
  quantity: number,
  onError: (message: string) => void,
) {
  try {
    await requestJson("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
  } catch (cause) {
    onError(errorMessage(cause));
  }
}

function mapApiOrder(order: Record<string, unknown>): StoreOrder {
  const items = Array.isArray(order.items) ? order.items : [];
  const shipping =
    order.shippingAddress && typeof order.shippingAddress === "object"
      ? (order.shippingAddress as Record<string, unknown>)
      : {};
  return {
    id: String(order.id),
    number: String(order.orderNumber),
    createdAt: String(order.createdAt),
    status: [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ].includes(String(order.status))
      ? (String(order.status) as StoreOrder["status"])
      : "PENDING",
    lines: items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      return [
        {
          productId:
            typeof row.productId === "string"
              ? row.productId
              : `snapshot-${String(row.id)}`,
          quantity: Number(row.quantity),
          name: String(row.productName ?? "Archived product"),
          sku: String(row.productSku ?? ""),
          image:
            typeof row.productImage === "string" ? row.productImage : undefined,
          unitPriceCents: Number(row.unitPriceCents),
          lineTotalCents: Number(row.lineTotalCents),
        },
      ];
    }),
    totalCents: Number(order.totalCents),
    address: [shipping.line1, shipping.city, shipping.country]
      .filter(Boolean)
      .join(", "),
  };
}

function parseJson(value: string | null): unknown {
  return value ? JSON.parse(value) : null;
}

export function parseStoredCart(value: string | null): CartLine[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((line): line is CartLine =>
    Boolean(
      line &&
      typeof line === "object" &&
      typeof line.productId === "string" &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0,
    ),
  );
}

function parseStoredOrders(value: string | null): StoreOrder[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((order): order is StoreOrder =>
    Boolean(
      order &&
      typeof order === "object" &&
      typeof order.id === "string" &&
      typeof order.number === "string" &&
      typeof order.createdAt === "string" &&
      Array.isArray(order.lines) &&
      Number.isInteger(order.totalCents),
    ),
  );
}
function parseStoredWishlist(value: string | null): string[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed)
    ? parsed
        .filter((item): item is string => typeof item === "string")
        .slice(0, 100)
    : [];
}

function parseStoredUser(value: string | null): StoreUser | null {
  const parsed = parseJson(value);
  return parsed &&
    typeof parsed === "object" &&
    "email" in parsed &&
    "name" in parsed &&
    typeof parsed.email === "string" &&
    typeof parsed.name === "string"
    ? (parsed as StoreUser)
    : null;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}

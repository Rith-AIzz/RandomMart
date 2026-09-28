import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider, type StoreUser } from "../components/store-provider";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { Notice } from "../components/notice";
import { isLiveMode } from "../lib/runtime-config";
import { createClient } from "../lib/supabase/server";
import { getCatalogProducts } from "../lib/catalog";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173",
  ),
  title: {
    default: "RandomMart — Everything you need",
    template: "%s · RandomMart",
  },
  description:
    "A warm, modern multi-category shopping experience for useful essentials and unexpected finds.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "RandomMart",
    title: "RandomMart — Everything you need",
    description:
      "Useful essentials and unexpected finds, thoughtfully selected.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RandomMart — Everything you need",
    description:
      "Useful essentials and unexpected finds, thoughtfully selected.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const liveMode = isLiveMode();
  const catalogProducts = await getCatalogProducts();
  let initialUser: StoreUser | null = null;
  if (liveMode) {
    const { data } = await (await createClient()).auth.getUser();
    if (data.user) {
      const { prisma } = await import("../lib/prisma/client");
      const profile = await prisma.profile.findUnique({
        where: { id: data.user.id },
        select: { role: true, fullName: true },
      });
      initialUser = {
        id: data.user.id,
        email: data.user.email ?? "",
        name:
          profile?.fullName ??
          String(
            data.user.user_metadata.full_name ??
              data.user.email?.split("@")[0] ??
              "Customer",
          ),
        role: profile?.role,
      };
    }
  }

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <StoreProvider
          initialUser={initialUser}
          liveMode={liveMode}
          catalogProducts={catalogProducts}
        >
          <SiteHeader />
          {children}
          <SiteFooter />
          <Notice />
        </StoreProvider>
      </body>
    </html>
  );
}

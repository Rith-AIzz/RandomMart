import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required for server-side database access.",
    );
  }
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

// Keep imports side-effect free so credential-free preview builds do not fail.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma() as unknown as Record<PropertyKey, unknown>;
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

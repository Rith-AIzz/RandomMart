import { prisma } from "../lib/prisma/client";
export const productRepository = {
  findActiveById: (id: string) =>
    prisma.product.findFirst({
      where: { id, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
  searchActive: (query: string) =>
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 24,
      orderBy: { createdAt: "desc" },
    }),
};

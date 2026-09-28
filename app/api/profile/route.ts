import {
  assertSameOrigin,
  toErrorResponse,
} from "../../../lib/application-error";
import { prisma } from "../../../lib/prisma/client";
import { addressSchema, profileUpdateSchema } from "../../../schemas/profile";
import { z } from "zod";
import { requireUser } from "../../../services/authorization.service";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        _count: { select: { orders: true } },
      },
    });
    return Response.json(
      { profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = profileUpdateSchema.parse(await request.json());
    const profile = await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: user.id },
        data: { fullName: input.fullName, phone: input.phone || null },
      });
      if (input.address) {
        await tx.address.updateMany({
          where: { profileId: user.id, isDefault: true },
          data: { isDefault: false },
        });
        if (input.address.id)
          await tx.address.update({
            where: { id: input.address.id, profileId: user.id },
            data: { ...input.address, id: undefined, isDefault: true },
          });
        else
          await tx.address.create({
            data: { ...input.address, profileId: user.id, isDefault: true },
          });
      }
      return tx.profile.findUnique({
        where: { id: user.id },
        include: { addresses: true },
      });
    });
    return Response.json({ profile });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = addressSchema.omit({ id: true }).parse(await request.json());
    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { profileId: user.id } });
      const makeDefault = input.isDefault || count === 0;
      if (makeDefault)
        await tx.address.updateMany({
          where: { profileId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      return tx.address.create({
        data: { ...input, profileId: user.id, isDefault: makeDefault },
      });
    });
    return Response.json({ address }, { status: 201 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = z
      .object({ id: z.string().uuid() })
      .parse(await request.json());
    const address = await prisma.address.findFirst({
      where: { id, profileId: user.id },
      select: { isDefault: true },
    });
    if (address)
      await prisma.$transaction(async (tx) => {
        await tx.address.deleteMany({ where: { id, profileId: user.id } });
        if (address.isDefault) {
          const next = await tx.address.findFirst({
            where: { profileId: user.id },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          if (next)
            await tx.address.update({
              where: { id: next.id },
              data: { isDefault: true },
            });
        }
      });
    return new Response(null, { status: 204 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}

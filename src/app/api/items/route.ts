import { NextResponse } from "next/server";
import { createHandler } from "@/lib/handler";
import { prisma } from "@/lib/prisma";
import { createItem, readItems } from "@/types/item";

export const GET = createHandler(readItems, async () => {
  return await prisma.item.findMany({
    orderBy: { issuedAt: "desc" },
  });
});

export const POST = createHandler(createItem, async ({ body }) => {
  const item = await prisma.item.create({
    data: body,
  });

  return NextResponse.json(item, { status: 201 });
});

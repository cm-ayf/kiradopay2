import { NextResponse } from "next/server";
import { createHandler } from "@/lib/handler";
import { createItem, readItems } from "@/types/item";

export const GET = createHandler(readItems, async () => {
  return await prisma.item.findMany({
    orderBy: { code: "asc" },
  });
});

export const POST = createHandler(createItem, async ({ body }) => {
  const item = await prisma.item.create({
    data: body,
  });

  return NextResponse.json(item, { status: 201 });
});

import { Prisma, PrismaClient } from "@prisma/client";
import type { Event } from "@/types/event";
import type { Receipt } from "@/types/receipt";

declare global {
  var prisma: PrismaClient;
}

export var prisma = (global.prisma ??= new PrismaClient());

export const eventInclude = {
  displays: {
    include: { item: true },
    orderBy: { itemcode: "asc" },
  },
} satisfies Prisma.EventInclude;

export function toEvent({
  date,
  displays,
  ...rest
}: Prisma.EventGetPayload<{ include: typeof eventInclude }>): Event {
  return {
    date: date.toISOString(),
    items: displays.map((display) => display.item),
    ...rest,
  };
}

export function toReceipt({
  createdAt,
  ...rest
}: Prisma.ReceiptGetPayload<{
  include: { records: true };
}>): Receipt {
  return {
    createdAt: createdAt.toISOString(),
    ...rest,
  };
}

import type { Event } from "@/types/event";
import { Prisma, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

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

import { NextResponse } from "next/server";
import { createHandler } from "@/lib/handler";
import { prisma, eventInclude, toEvent } from "@/lib/prisma";
import { createEvent, readEvents } from "@/types/event";

export const GET = createHandler(readEvents, async () => {
  const events = await prisma.event.findMany({
    include: eventInclude,
    orderBy: { date: "desc" },
  });
  return events.map(toEvent);
});

export const POST = createHandler(createEvent, async ({ body }) => {
  const { date, items, ...rest } = body;
  const event = await prisma.event.create({
    data: {
      ...rest,
      date: new Date(date),
      ...(items && {
        displays: {
          createMany: {
            data: items.map((itemcode) => ({ itemcode })),
          },
        },
      }),
    },
    include: eventInclude,
  });

  return NextResponse.json(toEvent(event), { status: 201 });
});

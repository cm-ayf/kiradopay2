import { createHandler } from "@/lib/handler";
import { eventInclude, toEvent } from "@/lib/prisma";
import { deleteEvent, readEvent, updateEvent } from "@/types/event";

export const GET = createHandler(readEvent, async ({ params }) => {
  const event = await prisma.event.findUniqueOrThrow({
    where: { code: params.eventcode },
    include: eventInclude,
  });

  return toEvent(event);
});

export const PATCH = createHandler(updateEvent, async ({ params, body }) => {
  const { date, items, ...rest } = body;
  const event = await prisma.event.update({
    where: { code: params.eventcode },
    data: {
      ...rest,
      ...(date && { date: new Date(date) }),
      ...(items && {
        displays: {
          deleteMany: {
            itemcode: { notIn: items },
          },
          createMany: {
            data: items.map((itemcode) => ({ itemcode })),
            skipDuplicates: true,
          },
        },
      }),
    },
    include: eventInclude,
  });

  return toEvent(event);
});

export const DELETE = createHandler(deleteEvent, async ({ params }) => {
  await prisma.$transaction([
    prisma.display.deleteMany({
      where: { eventcode: params.eventcode },
    }),
    prisma.event.delete({
      where: { code: params.eventcode },
    }),
  ]);

  return null;
});

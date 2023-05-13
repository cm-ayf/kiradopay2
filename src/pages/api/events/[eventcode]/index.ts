import type { NextApiRequest, NextApiResponse } from "next";
import { verify } from "@/lib/auth";
import { createHandler } from "@/lib/handler";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { deleteEvent, readEvent, updateEvent } from "@/types/event";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      await readEventHandler(req, res);
      break;
    case "PATCH":
      await updateEventHandler(req, res);
      break;
    case "DELETE":
      await deleteEventHandler(req, res);
      break;
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const readEventHandler = createHandler(readEvent, async (req, res) => {
  const token = verify(req, ["read"]);
  if (!token) {
    res.status(401).end();
    return;
  }

  const event = await prisma.event.findUniqueOrThrow({
    where: { code: req.query.eventcode },
    include: eventInclude,
  });

  res.status(200).json(toEvent(event));
});

const updateEventHandler = createHandler(updateEvent, async (req, res) => {
  const token = verify(req, ["read", "write"]);
  if (!token) {
    res.status(401).end();
    return;
  }

  if (req.body.calculator) {
    try {
      new Function("state", req.body.calculator);
    } catch (error) {
      res.status(400).end();
    }
  }

  const { date, items, ...rest } = req.body;
  const event = await prisma.event.update({
    where: { code: req.query.eventcode },
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

  res.status(200).json(toEvent(event));
});

const deleteEventHandler = createHandler(deleteEvent, async (req, res) => {
  const token = verify(req, ["write"]);
  if (!token) {
    res.status(401).end();
    return;
  }

  await prisma.$transaction([
    prisma.display.deleteMany({
      where: { eventcode: req.query.eventcode },
    }),
    prisma.event.delete({
      where: { code: req.query.eventcode },
    }),
  ]);

  res.status(200).json(null);
});

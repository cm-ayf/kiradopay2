import type { NextApiRequest, NextApiResponse } from "next";
import { createEvent, readEvents } from "@/types/event";
import { createHandler } from "@/lib/handler";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { verify } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST":
      await createEventHandler(req, res);
      break;
    case "GET":
      await readEventsHandler(req, res);
      break;
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const createEventHandler = createHandler(createEvent, async (req, res) => {
  const token = verify(req);
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

  res.status(200).json(toEvent(event));
});

const readEventsHandler = createHandler(readEvents, async (req, res) => {
  const token = verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const events = await prisma.event.findMany({ include: eventInclude });

  res.status(200).json(events.map(toEvent));
});

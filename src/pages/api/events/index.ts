import type { NextApiRequest, NextApiResponse } from "next";
import { createEvent, readEvents } from "@/types/event";
import { createHandler } from "@/lib/handler";
import { prisma } from "@/lib/prisma";
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
  const token = await verify(req);
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

  const event = await prisma.event.create({
    data: req.body,
  });

  res.status(200).json({ ...event, items: [] });
});

const readEventsHandler = createHandler(readEvents, async (req, res) => {
  const token = await verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const events = await prisma.event.findMany({
    include: {
      displays: {
        include: { item: true },
        orderBy: { itemcode: "asc" },
      },
    },
  });

  res.status(200).json(
    events.map(({ displays, ...event }) => ({
      ...event,
      items: displays.map(({ item }) => item),
    }))
  );
});

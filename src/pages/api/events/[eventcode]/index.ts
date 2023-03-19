import { createHandler } from "@/lib/handler";
import { verify } from "@/lib/auth";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { readEvent, updateEvent } from "@/types/event";
import type { NextApiRequest, NextApiResponse } from "next";

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
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const readEventHandler = createHandler(readEvent, async (req, res) => {
  const token = await verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const event = await prisma.event.findUnique({
    where: { code: req.query.eventcode },
    include: eventInclude,
  });

  if (!event) {
    res.status(404).end();
    return;
  }

  res.status(200).json(toEvent(event));
});

const updateEventHandler = createHandler(updateEvent, async (req, res) => {
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

  const event = await prisma.event.update({
    where: { code: req.query.eventcode },
    data: req.body,
    include: eventInclude,
  });

  res.status(200).json(toEvent(event));
});

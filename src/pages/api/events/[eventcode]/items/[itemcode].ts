import { createHandler } from "@/lib/handler";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createDisplay, deleteDisplay } from "@/types/display";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "PUT":
      await createDisplayHandler(req, res);
      break;
    case "DELETE":
      await deleteDisplayHandler(req, res);
      break;
    case "GET":
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const createDisplayHandler = createHandler(createDisplay, async (req, res) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).end();
    return;
  }

  const [event, item] = await prisma.$transaction([
    prisma.event.findUnique({
      where: { code: req.query.eventcode },
    }),
    prisma.item.findUnique({
      where: { code: req.query.itemcode },
    }),
  ]);

  if (!event || !item) {
    res.status(404).end();
    return;
  }

  const display = await prisma.display.create({
    data: {
      event: {
        connect: { code: event.code },
      },
      item: {
        connect: { code: item.code },
      },
    },
    include: { item: true },
  });

  res.status(200).json(display.item);
});

const deleteDisplayHandler = createHandler(deleteDisplay, async (req, res) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).end();
    return;
  }

  await prisma.display.delete({
    where: {
      eventcode_itemcode: {
        eventcode: req.query.eventcode,
        itemcode: req.query.itemcode,
      },
    },
  });

  res.status(200).end();
});

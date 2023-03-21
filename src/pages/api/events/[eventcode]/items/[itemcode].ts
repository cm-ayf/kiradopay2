import { createHandler } from "@/lib/handler";
import { verify } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const token = verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const { eventcode, itemcode } = req.query;
  const display = await prisma.display.create({
    data: {
      event: {
        connect: { code: eventcode },
      },
      item: {
        connect: { code: itemcode },
      },
    },
    include: { item: true },
  });

  res.status(200).json(display.item);
});

const deleteDisplayHandler = createHandler(deleteDisplay, async (req, res) => {
  const token = verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const { eventcode, itemcode } = req.query;
  const { item } = await prisma.display.delete({
    where: {
      eventcode_itemcode: { eventcode, itemcode },
    },
    include: { item: true },
  });

  res.status(200).json(item);
});

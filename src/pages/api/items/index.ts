import type { NextApiRequest, NextApiResponse } from "next";
import { createHandler } from "@/lib/handler";
import { prisma } from "@/lib/prisma";
import { createItem, readItems } from "@/types/item";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST":
      await createItemHandler(req, res);
      break;
    case "GET":
      await readItemsHandler(req, res);
      break;
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const createItemHandler = createHandler(createItem, async (req, res) => {
  const item = await prisma.item.create({
    data: req.body,
  });

  res.status(200).json(item);
});

const readItemsHandler = createHandler(readItems, async (_req, res) => {
  const items = await prisma.item.findMany({
    orderBy: { code: "asc" },
  });

  res.status(200).json(items);
});

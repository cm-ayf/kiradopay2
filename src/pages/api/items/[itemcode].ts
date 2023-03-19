import { verify } from "@/lib/auth";
import { createHandler } from "@/lib/handler";
import { prisma } from "@/lib/prisma";
import { deleteItem, updateItem } from "@/types/item";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
    case "HEAD":
      res.status(200).end();
      break;
    case "PATCH":
      await updateItemHandler(req, res);
      break;
    case "DELETE":
      await deleteItemHandler(req, res);
      break;
    default:
      res.status(405).end();
      break;
  }
}

const updateItemHandler = createHandler(updateItem, async (req, res) => {
  const token = await verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const item = await prisma.item.update({
    where: { code: req.query.itemcode },
    data: req.body,
  });

  res.status(200).json(item);
});

const deleteItemHandler = createHandler(deleteItem, async (req, res) => {
  const token = await verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  await prisma.item.delete({
    where: { code: req.query.itemcode },
  });

  res.status(200).json(null);
});

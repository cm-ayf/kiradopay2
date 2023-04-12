import { createHandler } from "@/lib/handler";
import { verify } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteReceipts } from "@/types/receipt";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST":
      await deleteReceiptsHandler(req, res);
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

const deleteReceiptsHandler = createHandler(
  deleteReceipts,
  async (req, res) => {
    const token = verify(req);
    if (!token) {
      res.status(401).end();
      return;
    }

    const { eventcode } = req.query;
    const ids = req.body;
    const [, { count }] = await prisma.$transaction([
      prisma.record.deleteMany({
        where: {
          eventcode,
          receiptId: { in: ids },
        },
      }),
      prisma.receipt.deleteMany({
        where: {
          eventcode,
          id: { in: ids },
        },
      }),
    ]);

    res.status(200).json(count);
  }
);

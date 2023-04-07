import { createHandler } from "@/lib/handler";
import { verify } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportReceipts } from "@/types/receipt";
import type { NextApiRequest, NextApiResponse } from "next";
import { stringify } from "csv-stringify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      await readReceiptsHandler(req, res);
      break;
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const readReceiptsHandler = createHandler(exportReceipts, async (req, res) => {
  const token = verify(req);
  if (!token) {
    res.status(401).end();
    return;
  }

  const { eventcode } = req.query;
  const [displays, receipts] = await prisma.$transaction([
    prisma.display.findMany({
      where: { eventcode },
    }),
    prisma.receipt.findMany({
      where: { eventcode },
      include: { records: true },
    }),
  ]);

  res
    .setHeader("Content-Type", "text/csv")
    .setHeader("Content-Disposition", `attachment; filename=${eventcode}.csv`);
  stringify(
    receipts.map(({ records, ...rest }) => ({
      ...rest,
      ...Object.fromEntries(
        records.map(({ itemcode, count }) => [itemcode, count])
      ),
    })),
    {
      header: true,
      columns: [
        "id",
        "createdAt",
        "total",
        "userId",
        ...displays.map(({ itemcode }) => itemcode),
      ],
    }
  ).pipe(res);
});

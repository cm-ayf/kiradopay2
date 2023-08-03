import { stringify } from "csv-stringify";
import { NextResponse } from "next/server";
import { createHandler } from "@/lib/handler";
import { exportReceipts } from "@/types/receipt";

export const GET = createHandler(exportReceipts, async ({ params }) => {
  const [displays, receipts] = await prisma.$transaction([
    prisma.display.findMany({
      where: { eventcode: params.eventcode },
    }),
    prisma.receipt.findMany({
      where: { eventcode: params.eventcode },
      include: { records: true },
    }),
  ]);

  const rows = receipts.map(({ records, ...rest }) => ({
    ...rest,
    ...Object.fromEntries(
      records.map(({ itemcode, count }) => [itemcode, count]),
    ),
  }));
  const columns = [
    "id",
    "createdAt",
    "total",
    "userId",
    ...displays.map(({ itemcode }) => itemcode),
  ];

  const result = await new Promise<string>((resolve, reject) => {
    stringify(rows, { header: true, columns, bom: true }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });

  return new NextResponse(result, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${params.eventcode}.csv`,
    },
  });
});

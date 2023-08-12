import { NextResponse } from "next/server";
import { createHandler } from "@/lib/handler";
import { createReceipts, readReceipts } from "@/types/receipt";

export const GET = createHandler(readReceipts, async ({ params }) => {
  const receipts = await prisma.receipt.findMany({
    where: { eventcode: params.eventcode },
    include: { records: true },
  });

  return receipts;
});

export const POST = createHandler(
  createReceipts,
  async ({ params, body, token }) => {
    const [receipts] = await prisma.$transaction([
      prisma.receipt.createMany({
        data: body.map(({ records: _, ...rest }) => ({
          ...rest,
          userId: token.id,
        })),
      }),
      prisma.record.createMany({
        data: body.flatMap(({ id, records }) =>
          records.map((record, index) => ({
            ...record,
            eventcode: params.eventcode,
            receiptId: id,
            index,
          })),
        ),
      }),
    ]);

    return NextResponse.json(receipts, { status: 201 });
  },
);

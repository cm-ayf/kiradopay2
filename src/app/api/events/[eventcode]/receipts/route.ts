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
    const receipts = await prisma.$transaction(
      body.map(({ records, ...rest }) =>
        prisma.receipt.create({
          data: {
            ...rest,
            eventcode: params.eventcode,
            userId: token.id,
            records: {
              create: records.map(({ itemcode, ...rest }, index) => ({
                ...rest,
                index,
                display: {
                  connect: {
                    eventcode_itemcode: {
                      eventcode: params.eventcode,
                      itemcode,
                    },
                  },
                },
              })),
            },
          },
          include: { records: true },
        }),
      ),
    );

    return NextResponse.json(receipts, { status: 201 });
  },
);

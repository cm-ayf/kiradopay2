import { createHandler } from "@/lib/handler";
import { deleteReceipts } from "@/types/receipt";

export const POST = createHandler(deleteReceipts, async ({ params, body }) => {
  const [, { count }] = await prisma.$transaction([
    prisma.record.deleteMany({
      where: {
        eventcode: params.eventcode,
        receiptId: { in: body },
      },
    }),
    prisma.receipt.deleteMany({
      where: {
        eventcode: params.eventcode,
        id: { in: body },
      },
    }),
  ]);

  return count;
});

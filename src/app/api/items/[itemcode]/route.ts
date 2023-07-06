import { createHandler } from "@/lib/handler";
import { deleteItem, updateItem } from "@/types/item";

export const PATCH = createHandler(updateItem, async ({ params, body }) => {
  return await prisma.item.update({
    where: { code: params.itemcode },
    data: body,
  });
});

export const DELETE = createHandler(deleteItem, async ({ params }) => {
  await prisma.item.delete({
    where: { code: params.itemcode },
  });

  return null;
});

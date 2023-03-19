import { Static, Type } from "@sinclair/typebox";
import type { Route } from "./route";
import { Code, Name } from "./common";

export const Item = Type.Object({
  code: Code,
  name: Name,
  picture: Type.String(),
});

export type Item = Static<typeof Item>;

export const CreateItem = Item;

export type CreateItem = Static<typeof CreateItem>;

export const UpdateItem = Type.Partial(CreateItem);

export type UpdateItem = Static<typeof UpdateItem>;

export const readItems = {
  method: "GET",
  path: "/api/items",
  response: Type.Array(Item),
} satisfies Route;

export const createItem = {
  method: "POST",
  path: "/api/items",
  body: CreateItem,
  response: Item,
} satisfies Route;

export const updateItem = {
  method: "PATCH",
  path: "/api/items/[itemcode]",
  params: Type.Object({ itemcode: Code }),
  body: UpdateItem,
  response: Item,
} satisfies Route;

export const deleteItem = {
  method: "DELETE",
  path: "/api/items/[itemcode]",
  params: Type.Object({ itemcode: Code }),
  response: Type.Null(),
} satisfies Route;

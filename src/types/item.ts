import { Static, Type } from "@sinclair/typebox";
import { Code, Name, Date } from "./common";
import type { Route } from "./route";

export const Item = Type.Object({
  code: Code,
  name: Name,
  picture: Type.String(),
  issuedAt: Date,
});

export type Item = Static<typeof Item>;

export const CreateItem = Item;

export type CreateItem = Static<typeof CreateItem>;

export const UpdateItem = Type.Partial(CreateItem);

export type UpdateItem = Static<typeof UpdateItem>;

export const readItems = {
  method: "GET",
  path: "/api/items",
  scopes: ["read"],
  response: Type.Array(Item),
} satisfies Route;

export const createItem = {
  method: "POST",
  path: "/api/items",
  scopes: ["write"],
  body: CreateItem,
  response: Item,
} satisfies Route;

export const updateItem = {
  method: "PATCH",
  path: "/api/items/[itemcode]",
  scopes: ["read", "write"],
  params: Type.Object({ itemcode: Code }),
  body: UpdateItem,
  response: Item,
} satisfies Route;

export const deleteItem = {
  method: "DELETE",
  path: "/api/items/[itemcode]",
  scopes: ["write"],
  params: Type.Object({ itemcode: Code }),
  response: Type.Null(),
} satisfies Route;

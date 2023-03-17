import { Type } from "@sinclair/typebox";
import type { Route } from "./route";
import { Code, Name } from "./common";

export const Item = Type.Object({
  code: Code,
  name: Name,
  picture: Type.String(),
});

export const CreateItem = Item;

export const UpdateItem = Type.Partial(CreateItem);

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
  method: "PUT",
  path: "/api/items/[itemcode]",
  body: UpdateItem,
  response: Item,
} satisfies Route;

export const deleteItem = {
  method: "DELETE",
  path: "/api/items/[itemcode]",
  response: Type.Null(),
} satisfies Route;

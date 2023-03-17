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

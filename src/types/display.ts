import { Type } from "@sinclair/typebox";
import { Item } from "./item";
import type { Route } from "./route";
import { Code } from "./common";

export const createDisplay = {
  method: "PUT",
  path: "/api/events/[eventcode]/items/[itemcode]",
  params: Type.Object({ eventcode: Code, itemcode: Code }),
  response: Item,
} satisfies Route;

export const deleteDisplay = {
  method: "DELETE",
  path: "/api/events/[eventcode]/items/[itemcode]",
  params: Type.Object({ eventcode: Code, itemcode: Code }),
  response: Item,
} satisfies Route;

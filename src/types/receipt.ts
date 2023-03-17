import { Type } from "@sinclair/typebox";
import type { Route } from "./route";

export const Record = Type.Object({
  itemcode: Type.String(),
  count: Type.Integer(),
});

export const Receipt = Type.Object({
  id: Type.String(),
  createdAt: Type.Date(),
  total: Type.Integer(),
  eventcode: Type.String(),
  records: Type.Array(Record),
});

export const createReceipts = {
  method: "POST",
  path: "/api/events/[eventcode]/receipts",
  params: Type.Object({
    eventcode: Type.String(),
  }),
  body: Type.Array(Receipt),
  response: Type.Array(Receipt),
} satisfies Route;

export const readReceipts = {
  method: "GET",
  path: "/api/events/[eventcode]/receipts",
  params: Type.Object({
    eventcode: Type.String(),
  }),
  response: Type.Array(Receipt),
} satisfies Route;

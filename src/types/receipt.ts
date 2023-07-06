import { Static, Type } from "@sinclair/typebox";
import { Code, Date } from "./common";
import type { Route } from "./route";

export const Record = Type.Object({
  itemcode: Code,
  count: Type.Integer(),
  dedication: Type.Boolean(),
});

export type Record = Static<typeof Record>;

export const Receipt = Type.Object({
  id: Type.String(),
  createdAt: Date,
  total: Type.Integer(),
  eventcode: Code,
  records: Type.Array(Record),
});

export type Receipt = Static<typeof Receipt>;

export const createReceipts = {
  method: "POST",
  path: "/api/events/[eventcode]/receipts",
  scopes: ["write"],
  params: Type.Object({
    eventcode: Type.String(),
  }),
  body: Type.Array(Receipt),
  response: Type.Array(Receipt),
} satisfies Route;

export const readReceipts = {
  method: "GET",
  path: "/api/events/[eventcode]/receipts",
  scopes: ["read"],
  params: Type.Object({
    eventcode: Type.String(),
  }),
  response: Type.Array(Receipt),
} satisfies Route;

export const exportReceipts = {
  method: "GET",
  path: "/api/events/[eventcode]/receipts/export",
  scopes: ["read"],
  params: Type.Object({
    eventcode: Type.String(),
  }),
  response: Type.Unknown(),
} satisfies Route;

export const deleteReceipts = {
  method: "POST",
  path: "/api/events/[eventcode]/receipts/delete",
  scopes: ["write"],
  params: Type.Object({
    eventcode: Type.String(),
  }),
  body: Type.Array(Type.String()),
  response: Type.Integer(),
} satisfies Route;

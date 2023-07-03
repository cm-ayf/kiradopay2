import { Static, Type } from "@sinclair/typebox";
import { Code, Date, Name } from "./common";
import { Item } from "./item";
import type { Route } from "./route";

export const Event = Type.Object({
  code: Code,
  name: Name,
  date: Date,
  calculator: Type.String(),
  items: Type.Array(Item),
});

export type Event = Static<typeof Event>;

export const CreateEvent = Type.Object({
  code: Code,
  name: Name,
  date: Date,
  calculator: Type.Optional(Type.String()),
  items: Type.Optional(Type.Array(Code)),
});

export type CreateEvent = Static<typeof CreateEvent>;

export const UpdateEvent = Type.Partial(CreateEvent);

export type UpdateEvent = Static<typeof UpdateEvent>;

export const readEvents = {
  method: "GET",
  path: "/api/events",
  scopes: ["read"],
  response: Type.Array(Event),
} satisfies Route;

export const createEvent = {
  method: "POST",
  path: "/api/events",
  scopes: ["write"],
  body: CreateEvent,
  response: Event,
} satisfies Route;

export const readEvent = {
  method: "GET",
  path: "/api/events/[eventcode]",
  scopes: ["read"],
  params: Type.Object({ eventcode: Code }),
  response: Event,
} satisfies Route;

export const updateEvent = {
  method: "PATCH",
  path: "/api/events/[eventcode]",
  scopes: ["read", "write"],
  params: Type.Object({ eventcode: Code }),
  body: UpdateEvent,
  response: Event,
} satisfies Route;

export const deleteEvent = {
  method: "DELETE",
  path: "/api/events/[eventcode]",
  scopes: ["write"],
  params: Type.Object({ eventcode: Code }),
  response: Type.Null(),
} satisfies Route;

import { Static, Type } from "@sinclair/typebox";
import type { Route } from "./route";

export const Token = Type.Object({
  id: Type.String(),
  username: Type.String(),
  nick: Type.Union([Type.String(), Type.Null()]),
  avatar: Type.Union([Type.String(), Type.Null()]),
  exp: Type.Integer(),
});

export type Token = Static<typeof Token>;

export const readUsersMe = {
  method: "GET",
  path: "/api/users/me",
  response: Token,
} satisfies Route;

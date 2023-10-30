import { Static, Type } from "@sinclair/typebox";
import type { Route } from "./route";

export const Token = Type.Object({
  id: Type.String(),
  username: Type.String(),
  nick: Type.Union([Type.String(), Type.Null()]),
  avatar: Type.Union([Type.String(), Type.Null()]),
  iat: Type.Integer(),
  exp: Type.Integer(),
  scope: Type.Optional(Type.String()),
});

export type Token = Static<typeof Token>;

export const readUsersMe = {
  method: "GET",
  path: "/api/users/me",
  response: Token,
} satisfies Route;

export const refreshInPlace = {
  method: "POST",
  path: "/api/auth/refresh",
  response: Type.Unknown(),
} satisfies Route;

export type Scope = "read" | "register" | "write";

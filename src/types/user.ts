import { Static, Type } from "@sinclair/typebox";
import type { Route } from "./route";

export const Token = Type.Object({
  sub: Type.String(),
  email: Type.String(),
  name: Type.String(),
  picture: Type.String(),
  exp: Type.Integer(),
});

export type Token = Static<typeof Token>;

export const readUsersMe = {
  method: "GET",
  path: "/api/users/me",
  response: Token,
} satisfies Route;

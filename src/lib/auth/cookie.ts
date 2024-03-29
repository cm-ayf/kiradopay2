import { CookieSerializeOptions } from "cookie";
import { NextResponse } from "next/server";
import { env } from "../env";

const host = new URL(env.HOST);

const baseCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: host.protocol === "https:",
  path: "/",
};

const cookieOptions = {
  session: {
    ...baseCookieOptions,
    maxAge: 3600,
  },
  access_token: {
    ...baseCookieOptions,
    maxAge: 604800,
  },
  refresh_token: {
    ...baseCookieOptions,
    maxAge: 31536000,
  },
  state: {
    ...baseCookieOptions,
    sameSite: "lax",
    maxAge: 600,
  },
} satisfies {
  [key: string]: CookieSerializeOptions;
};

type Cookies = {
  [key in keyof typeof cookieOptions]?: string;
};

export function withCookies(
  response: NextResponse,
  cookies: Cookies,
): NextResponse {
  for (const [name, value] of Object.entries(cookies).filter(
    (entry): entry is [keyof Cookies, string] => entry[0] in cookieOptions,
  )) {
    if (value) response.cookies.set(name, value, cookieOptions[name]);
    else response.cookies.delete(name);
  }
  return response;
}

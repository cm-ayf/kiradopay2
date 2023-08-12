import { CookieSerializeOptions } from "cookie";
import type {
  RESTOAuth2AuthorizationQuery,
  RESTPostOAuth2AccessTokenResult,
  RESTPostOAuth2AccessTokenURLEncodedData,
  RESTPostOAuth2RefreshTokenResult,
  RESTPostOAuth2RefreshTokenURLEncodedData,
  RESTGetCurrentUserGuildMemberResult,
} from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { env } from "./env";
import { prisma } from "./prisma";
import { OAuth2Error } from "@/shared/error";
import type { Token, Scope } from "@/types/user";

const client_id = env.DISCORD_CLIENT_ID;
const client_secret = env.DISCORD_CLIENT_SECRET;
const host = new URL(env.HOST);
const redirect_uri = new URL("/api/auth/callback", env.HOST).toString();
const basic = btoa(`${client_id}:${client_secret}`);

const scope = ["identify", "guilds.members.read"];

export function generateAuthUrl(state: string) {
  const url = new URL("https://discord.com/oauth2/authorize");

  const searchParams = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: "code",
    scope: scope.join(" "),
    state,
  } satisfies RESTOAuth2AuthorizationQuery);
  url.search = searchParams.toString();

  return url;
}

export async function exchangeCode(
  code: string,
): Promise<RESTPostOAuth2AccessTokenResult> {
  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: "authorization_code",
        code,
        redirect_uri,
      } satisfies RESTPostOAuth2AccessTokenURLEncodedData),
      cache: "no-cache",
    });

    if (response.status === 400) {
      throw new OAuth2Error("invalid_credentials", "Invalid grant");
    } else if (!response.ok) {
      throw new OAuth2Error("server_error", "Failed to exchange code");
    }

    return await response.json();
  } catch (e) {
    if (e instanceof OAuth2Error) throw e;
    throw new OAuth2Error("server_error", "Failed to exchange code", {
      cause: e,
    });
  }
}

export async function refreshTokens(
  refresh_token: string,
): Promise<RESTPostOAuth2RefreshTokenResult> {
  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: "refresh_token",
        refresh_token,
      } satisfies RESTPostOAuth2RefreshTokenURLEncodedData),
      cache: "no-cache",
    });

    if (response.status === 400) {
      throw new OAuth2Error("invalid_credentials", "Invalid grant");
    } else if (!response.ok) {
      throw new OAuth2Error("server_error", "Failed to refresh tokens");
    }

    return await response.json();
  } catch (e) {
    if (e instanceof OAuth2Error) throw e;
    throw new OAuth2Error("server_error", "Failed to refresh tokens", {
      cause: e,
    });
  }
}

export async function createSession(accessToken: string, upsert = false) {
  try {
    const response = await fetch(
      `https://discord.com/api/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-cache",
      },
    );
    if (response.status === 401) {
      throw new OAuth2Error("invalid_credentials", "Invalid token");
    } else if (!response.ok) {
      throw new OAuth2Error("server_error", "Failed to get guild member");
    }

    const member: RESTGetCurrentUserGuildMemberResult = await response.json();
    const { user, roles, nick = null, avatar: memberAvatar } = member;
    const { id, username, avatar: userAvatar = null } = user!;
    const avatar: string | null = memberAvatar ?? userAvatar;
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    const scope = env.DISCORD_ROLE_ID
      ? roles.includes(env.DISCORD_ROLE_ID)
        ? "read write"
        : "read"
      : "read write";

    if (upsert) {
      await prisma.user.upsert({
        where: { id },
        create: { id },
        update: {},
      });
    }

    return jwt.sign({ id, username, nick, avatar, exp, scope }, env.JWT_SECRET);
  } catch (e) {
    if (e instanceof OAuth2Error) throw e;
    throw new OAuth2Error("server_error", "create session failed", {
      cause: e,
    });
  }
}

export async function revokeToken(accessToken: string) {
  try {
    const response = await fetch(
      "https://discord.com/api/oauth2/token/revoke",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: accessToken,
          token_type_hint: "access_token",
        }),
        cache: "no-cache",
      },
    );
    if (response.status === 400) {
      throw new OAuth2Error("invalid_credentials", "Invalid token");
    } else if (!response.ok) {
      throw new OAuth2Error("server_error", "Failed to revoke token");
    }
  } catch (e) {
    if (e instanceof OAuth2Error) throw e;
    throw new OAuth2Error("server_error", "Failed to revoke token", {
      cause: e,
    });
  }
}

export function verify(
  cookies: Pick<NextRequest["cookies"], "get">,
  scope?: Scope[],
) {
  const session = cookies.get("session");
  if (!session) return null;

  try {
    const token = jwt.verify(session.value, env.JWT_SECRET) as Token;
    if (scope && !hasScopes(token, scope)) {
      return null;
    }
    return token;
  } catch (err) {
    return null;
  }
}

function hasScopes(token: Token, verifyScopes: Scope[]) {
  const tokenScopes = new Set((token.scope ?? "").split(" "));
  return verifyScopes.every((scope) => tokenScopes.has(scope));
}

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

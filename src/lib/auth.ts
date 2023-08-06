import { CookieSerializeOptions } from "cookie";
import DiscordOAuth2, {
  DiscordHTTPError,
  DiscordRESTError,
} from "discord-oauth2";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { env } from "./env";
import { prisma } from "./prisma";
import { OAuth2Error } from "@/shared/error";
import type { Token, Scope } from "@/types/user";

declare module "discord-oauth2" {
  // https://discord.com/developers/docs/resources/user#user-object
  interface User {
    global_name: string;
  }

  // https://discord.com/developers/docs/resources/guild#guild-member-object
  interface Member {
    avatar: string | null | undefined;
  }
}

const clientId = env.DISCORD_CLIENT_ID;
const clientSecret = env.DISCORD_CLIENT_SECRET;
const host = new URL(env.HOST);

const client = new DiscordOAuth2({
  clientId,
  clientSecret,
  redirectUri: new URL("/api/auth/callback", host).toString(),
  credentials: Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
});

const scope = ["identify", "guilds.members.read"];

export function generateAuthUrl(state: string) {
  return client.generateAuthUrl({
    scope,
    state,
  });
}

function handleTokenRequestError(e: unknown): never {
  if (
    e instanceof DiscordHTTPError &&
    (e.response as any).error === "invalid_grant"
  ) {
    throw new OAuth2Error("invalid_credentials", "Invalid grant", {
      cause: e,
    });
  } else {
    throw new OAuth2Error("server_error", "Failed to exchange code", {
      cause: e,
    });
  }
}

export async function exchangeCode(code: string) {
  return client
    .tokenRequest({
      scope,
      grantType: "authorization_code",
      code,
    })
    .catch(handleTokenRequestError);
}

export async function refreshTokens(refreshToken: string) {
  return client
    .tokenRequest({
      scope,
      grantType: "refresh_token",
      refreshToken,
    })
    .catch(handleTokenRequestError);
}

function handleGetGuildMemberError(e: unknown): never {
  if (e instanceof DiscordRESTError && e.code === 10004) {
    throw new OAuth2Error("unknown_guild", "Unknown guild", {
      cause: e,
    });
  } else if (e instanceof DiscordHTTPError && e.res.statusCode === 401) {
    throw new OAuth2Error("invalid_credentials", "Invalid token", {
      cause: e,
    });
  } else {
    throw new OAuth2Error("server_error", "Failed to get guild member", {
      cause: e,
    });
  }
}

export async function createSession(accessToken: string, upsert = false) {
  const {
    user,
    roles,
    nick = null,
    avatar: memberAvatar,
  } = await client
    .getGuildMember(accessToken, env.DISCORD_GUILD_ID)
    .catch(handleGetGuildMemberError);

  if (!user) {
    throw new OAuth2Error("server_error", "Failed to get user");
  }

  try {
    const { id, username, avatar: userAvatar = null } = user;
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
    throw new OAuth2Error("server_error", "create session failed", {
      cause: e,
    });
  }
}

export async function revokeToken(accessToken: string) {
  return client.revokeToken(accessToken).catch(handleTokenRequestError);
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

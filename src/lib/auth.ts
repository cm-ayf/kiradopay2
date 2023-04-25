import { CookieSerializeOptions, serialize } from "cookie";
import DiscordOAuth2 from "discord-oauth2";
import * as _jwt from "jsonwebtoken";
import type { NextApiResponse } from "next";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import { prisma } from "./prisma";
import type { Token } from "@/types/user";

const clientId = process.env["DISCORD_CLIENT_ID"];
if (!clientId) {
  throw new Error("Missing DISCORD_CLIENT_ID");
}
const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
if (!clientSecret) {
  throw new Error("Missing DISCORD_CLIENT_SECRET");
}
const host = process.env["HOST"];
if (!host) {
  throw new Error("Missing HOST");
}
const secret = process.env["JWT_SECRET"];
if (!secret) {
  throw new Error("Missing JWT_SECRET");
}
const guildId = process.env["DISCORD_GUILD_ID"];
if (!guildId) {
  throw new Error("Missing DISCORD_GUILD_ID");
}
const roleId = process.env["DISCORD_ROLE_ID"];
export const options = { guildId, roleId };

const secure = host.startsWith("https:");

export const client = new DiscordOAuth2({
  clientId,
  clientSecret,
  redirectUri: `${host}/api/auth/callback`,
  credentials: Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
});

export const scope = ["identify", "guilds.members.read"];

class JWT {
  constructor(private readonly secret: string) {}

  sign(payload: Token) {
    return _jwt.sign(payload, this.secret);
  }

  verify(token: string): Token {
    const payload = _jwt.verify(token, this.secret);
    return typeof payload === "object" ? payload : JSON.parse(payload);
  }
}

const jwt = new JWT(secret);

export async function createCredentials(
  tokens: Tokens,
  upsert = false
): Promise<Credentials> {
  const {
    user,
    roles,
    nick = null,
    // @ts-expect-error avatar is not defined in the type
    avatar: memberAvatar,
  } = await client.getGuildMember(tokens.access_token, options.guildId);

  if (!user) {
    throw new Error("Missing user");
  }
  if (options.roleId && !roles.includes(options.roleId)) {
    throw new Error("Missing role");
  }

  const { id, username, avatar: userAvatar = null } = user;
  const avatar: string | null = memberAvatar ?? userAvatar;
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const session = jwt.sign({ id, username, nick, avatar, exp });

  if (upsert) {
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: { id },
    });
  }

  return { ...tokens, session };
}

export function redirectError(res: NextApiResponse, error?: unknown) {
  const params = new URLSearchParams("error=invalid_credentials");
  if (error instanceof Error) {
    params.append("error_description", error.message);
  }
  res.redirect(`/?${params.toString()}`);
}

export function verify(req: { cookies: NextApiRequestCookies }) {
  const { session } = req.cookies;
  if (!session) return;

  try {
    return jwt.verify(session);
  } catch (err) {
    return null;
  }
}

const sessionCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  path: "/",
  maxAge: 60 * 60,
};

const accessTokenCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  path: "/",
  maxAge: 604800,
};

const refreshTokenCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  path: "/",
};

const clearCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  path: "/",
  maxAge: -1,
};

interface Tokens {
  access_token: string;
  refresh_token?: string;
}

export interface Credentials extends Tokens {
  session: string;
}

export function setCredentials(
  res: NextApiResponse,
  credentials: Partial<Credentials>
) {
  const { session, access_token, refresh_token } = credentials;
  const cookies: string[] = [];
  if (session) {
    cookies.push(serialize("session", session, sessionCookieOptions));
  }
  if (access_token) {
    cookies.push(
      serialize("access_token", access_token, accessTokenCookieOptions)
    );
  }
  if (refresh_token) {
    cookies.push(
      serialize("refresh_token", refresh_token, refreshTokenCookieOptions)
    );
  }

  res.setHeader("Set-Cookie", cookies);
}

export function clearCredentials(res: NextApiResponse) {
  res.setHeader("Set-Cookie", [
    serialize("session", "", clearCookieOptions),
    serialize("access_token", "", clearCookieOptions),
    serialize("refresh_token", "", clearCookieOptions),
  ]);
}

const stateCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure,
  path: "/api/auth",
  maxAge: 600,
};

export function setState(res: NextApiResponse, state: string) {
  res.setHeader("Set-Cookie", serialize("state", state, stateCookieOptions));
}

export function clearState(res: NextApiResponse) {
  res.setHeader("Set-Cookie", serialize("state", "", clearCookieOptions));
}

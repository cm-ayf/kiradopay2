import DiscordOAuth2 from "discord-oauth2";
import * as _jwt from "jsonwebtoken";
import { CookieSerializeOptions, serialize } from "cookie";
import type { NextApiResponse } from "next";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import type { Token } from "@/types/user";
import { prisma } from "./prisma";

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
  credentials: DiscordOAuth2.TokenRequestResult,
  upsert = false
): Promise<Credentials | null> {
  const {
    user,
    roles,
    nick = null,
    // @ts-expect-error avatar is not defined in the type
    avatar: memberAvatar,
  } = await client.getGuildMember(credentials.access_token, options.guildId);

  if (!user) return null;
  if (options.roleId && !roles.includes(options.roleId)) return null;

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

  return { ...credentials, session };
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
  maxAge: 3600,
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

export interface Credentials extends DiscordOAuth2.TokenRequestResult {
  session: string;
}

export function setCredentials(res: NextApiResponse, credentials: Credentials) {
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

import type { RESTGetCurrentUserGuildMemberResult } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { env } from "../env";
import { prisma } from "../prisma";
import { OAuth2Error } from "@/shared/error";
import type { Token, Scope } from "@/types/user";

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

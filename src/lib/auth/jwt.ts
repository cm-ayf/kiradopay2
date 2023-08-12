import type { RESTGetCurrentUserGuildMemberResult } from "discord-api-types/v10";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { env } from "../env";
import { OAuth2Error } from "@/shared/error";
import { typeCheck } from "@/shared/utils";
import { Token, Scope } from "@/types/user";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function createSession(accessToken: string) {
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
    const scope = env.DISCORD_ROLE_ID
      ? roles.includes(env.DISCORD_ROLE_ID)
        ? "read write"
        : "read"
      : "read write";

    return await new SignJWT({ id, username, nick, avatar, scope })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);
  } catch (e) {
    if (e instanceof OAuth2Error) throw e;
    throw new OAuth2Error("server_error", "create session failed", {
      cause: e,
    });
  }
}

export async function verify(
  cookies: Pick<NextRequest["cookies"], "get">,
  scope?: Scope[],
) {
  const session = cookies.get("session");
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session.value, secret);
    if (!typeCheck(Token, payload)) return null;
    if (scope && !hasScopes(payload, scope)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function hasScopes(token: Token, verifyScopes: Scope[]) {
  const tokenScopes = new Set((token.scope ?? "").split(" "));
  return verifyScopes.every((scope) => tokenScopes.has(scope));
}

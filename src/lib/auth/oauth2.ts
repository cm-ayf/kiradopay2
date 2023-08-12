import type {
  RESTOAuth2AuthorizationQuery,
  RESTPostOAuth2AccessTokenResult,
  RESTPostOAuth2AccessTokenURLEncodedData,
  RESTPostOAuth2RefreshTokenResult,
  RESTPostOAuth2RefreshTokenURLEncodedData,
} from "discord-api-types/v10";
import { env } from "../env";
import { OAuth2Error } from "@/shared/error";

const client_id = env.DISCORD_CLIENT_ID;
const client_secret = env.DISCORD_CLIENT_SECRET;
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

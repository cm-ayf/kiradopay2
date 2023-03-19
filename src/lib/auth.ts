import {
  OAuth2ClientOptions,
  Credentials,
  OAuth2Client,
  TokenPayload,
} from "google-auth-library";
import { CookieSerializeOptions, serialize } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

const clientId = process.env["GOOGLE_CLIENT_ID"];
if (!clientId) {
  throw new Error("Missing GOOGLE_CLIENT_ID");
}
const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
if (!clientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET");
}
const host = process.env["HOST"];
if (!host) {
  throw new Error("Missing HOST");
}

const secure = host.startsWith("https:");

export const options = {
  clientId,
  clientSecret,
  redirectUri: `${host}/api/auth/callback`,
} satisfies OAuth2ClientOptions;

export async function verify(req: NextApiRequest) {
  const { id_token } = req.cookies;
  if (!id_token) return;

  const client = new OAuth2Client(options);
  const ticket = await client.verifyIdToken({
    idToken: id_token,
    audience: options.clientId,
  });

  const payload = ticket.getPayload();
  if (!isValidPayload(payload)) return;

  return payload;
}

type ValidPayload = TokenPayload &
  Required<Pick<TokenPayload, "sub" | "email" | "name" | "picture">>;

function isValidPayload(
  payload: TokenPayload | undefined
): payload is ValidPayload {
  if (!payload) return false;
  const { sub, email, email_verified, name, picture } = payload;
  return Boolean(sub && email && email_verified && name && picture);
}

const idTokenCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  path: "/",
  maxAge: 3600,
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

export function setCredentials(res: NextApiResponse, credentials: Credentials) {
  const { id_token, refresh_token } = credentials;
  const cookies: string[] = [];
  if (id_token) {
    cookies.push(serialize("id_token", id_token, idTokenCookieOptions));
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
    serialize("id_token", "", clearCookieOptions),
    serialize("refresh_token", "", clearCookieOptions),
  ]);
}

const codeVerifierCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure,
  path: "/api/auth",
  maxAge: 600,
};

export function setCodeVerifier(res: NextApiResponse, codeVerifier: string) {
  res.setHeader(
    "Set-Cookie",
    serialize("code_verifier", codeVerifier, codeVerifierCookieOptions)
  );
}

export function clearCodeVerifier(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize("code_verifier", "", clearCookieOptions)
  );
}

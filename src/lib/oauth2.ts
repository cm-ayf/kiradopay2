import {
  OAuth2ClientOptions,
  Credentials,
  OAuth2Client,
  TokenPayload,
} from "google-auth-library";
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

const secure = process.env["NODE_ENV"] === "production";

export const options = {
  clientId,
  clientSecret,
  redirectUri: `https://${host}/api/auth/callback`,
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

export function setCredentials(res: NextApiResponse, credentials: Credentials) {
  const { expiry_date } = credentials;
  if (!expiry_date) return res;

  const expires = new Date(expiry_date);
  return res.setHeader(
    "Set-Cookie",
    Object.entries(credentials).map(
      ([key, value]) =>
        `${key}=${value}; HttpOnly; SameSite=Strict; Expires=${expires}${
          secure ? " Secure;" : ""
        }`
    )
  );
}

export function setCodeVerifier(res: NextApiResponse, state: string) {
  return res.setHeader(
    "Set-Cookie",
    `code_verifier=${state}; HttpOnly; SameSite=Lax; Expires=0${
      secure ? " Secure;" : ""
    }`
  );
}

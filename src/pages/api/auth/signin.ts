import { options, setCodeVerifier } from "@/lib/auth";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "HEAD":
      res.status(200).end();
      break;
    case "GET":
      break;
    default:
      res.status(405).end();
  }

  const client = new OAuth2Client(options);

  const { refresh_token } = req.cookies;
  if (refresh_token) {
    res.redirect("/api/auth/refresh");
    return;
  }

  const { codeVerifier, codeChallenge } =
    await client.generateCodeVerifierAsync();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: "openid email profile",
    state: codeVerifier,
    code_challenge: codeChallenge!,
    code_challenge_method: CodeChallengeMethod.S256,
  });

  setCodeVerifier(res, codeVerifier);
  res.redirect(url);
}

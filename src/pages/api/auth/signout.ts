import { clearCredentials, options } from "@/lib/auth";
import { OAuth2Client } from "google-auth-library";
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
    await client.revokeToken(refresh_token);
  }

  clearCredentials(res);
  res.redirect("/");
}

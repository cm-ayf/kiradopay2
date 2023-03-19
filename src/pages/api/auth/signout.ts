import { options } from "@/lib/oauth2";
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

  const { access_token } = req.cookies;
  if (access_token) {
    await client.revokeToken(access_token);
  }

  res.setHeader("Clear-Site-Data", '"cookies"').redirect("/");
}

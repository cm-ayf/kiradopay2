import { options, setCredentials } from "@/lib/oauth2";
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
    case "POST":
      break;
    default:
      res.status(405).end();
  }

  const client = new OAuth2Client(options);

  const { refresh_token, expiry_date } = req.cookies;
  if (!refresh_token || !expiry_date || Date.now() >= parseInt(expiry_date)) {
    res.setHeader("Clear-Site-Data", '"cookies"').redirect("/api/auth/signin");
    return;
  }

  client.setCredentials({
    refresh_token,
    expiry_date: parseInt(expiry_date),
  });
  const { credentials } = await client.refreshAccessToken();
  setCredentials(res, credentials);
  switch (req.method) {
    case "GET":
      res.redirect("/");
      break;
    case "POST":
      res.status(200).end();
      break;
  }
}

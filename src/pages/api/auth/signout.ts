import type { NextApiRequest, NextApiResponse } from "next";
import { client, clearCredentials } from "@/lib/auth";

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

  const { access_token } = req.cookies;
  if (access_token) {
    await client.revokeToken(access_token);
  }

  clearCredentials(res);
  res.redirect("/");
}

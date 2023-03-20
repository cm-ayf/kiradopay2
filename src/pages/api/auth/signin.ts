import { client, scope, setState } from "@/lib/auth";
import { randomUUID } from "crypto";
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

  const { refresh_token } = req.cookies;
  if (refresh_token) {
    res.redirect("/api/auth/refresh");
    return;
  }

  const state = randomUUID();
  const url = client.generateAuthUrl({ scope, state });

  setState(res, state);
  res.redirect(url);
}

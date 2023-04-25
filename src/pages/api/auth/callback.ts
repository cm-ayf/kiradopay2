import type { NextApiRequest, NextApiResponse } from "next";
import {
  clearState,
  client,
  createCredentials,
  redirectError,
  scope,
  setCredentials,
} from "@/lib/auth";

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

  const { code, state: stateFromQuery } = req.query;
  if (typeof code !== "string" || typeof stateFromQuery !== "string") {
    res.status(400).end();
    return;
  }

  const { state: stateFromCookie } = req.cookies;
  if (stateFromCookie !== stateFromQuery) {
    res.status(400).end();
    return;
  }

  clearState(res);
  const response = await client.tokenRequest({
    grantType: "authorization_code",
    code,
    scope,
  });

  try {
    const credentials = await createCredentials(response, true);

    setCredentials(res, credentials);
    res.redirect("/");
  } catch (error) {
    redirectError(res, error);
  }
}

import {
  client,
  clearCredentials,
  scope,
  setCredentials,
  createCredentials,
  redirectError,
} from "@/lib/auth";
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

  const { access_token, refresh_token } = req.cookies;

  if (access_token) {
    try {
      const { session } = await createCredentials({ access_token });
      setCredentials(res, { session });
      success(req, res);
      return;
    } catch (e) {}
  }

  if (refresh_token) {
    try {
      const response = await client.tokenRequest({
        scope,
        grantType: "refresh_token",
        refreshToken: refresh_token,
      });

      const credentials = await createCredentials(response);
      setCredentials(res, credentials);
      success(req, res);
    } catch (e) {}
  }

  clearCredentials(res);
  failure(req, res);
}

function success(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      res.redirect("/");
      break;
    case "POST":
      res.status(200).end();
      break;
  }
}

function failure(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      redirectError(res);
      break;
    case "POST":
      res.status(401).end();
      break;
  }
}

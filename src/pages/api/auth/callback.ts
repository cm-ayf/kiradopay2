import { options, setCredentials } from "@/lib/oauth2";
import { prisma } from "@/lib/prisma";
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

  const { code, state } = req.query;
  if (typeof code !== "string" || typeof state !== "string") {
    res.status(400).end();
    return;
  }

  const { code_verifier: codeVerifier } = req.cookies;
  if (!codeVerifier || codeVerifier !== state) {
    res.status(400).end();
    return;
  }

  const { tokens } = await client.getToken({
    code,
    codeVerifier,
  });

  if (!tokens.id_token) {
    res.status(400).end();
    return;
  }

  const ticket = await client.verifyIdToken({ idToken: tokens.id_token });
  const { sub, email, name, picture } = ticket.getPayload()!;
  if (!email || !name || !picture) {
    res.status(400).end();
    return;
  }
  const update = { email, name, picture };

  await prisma.user.upsert({
    where: { sub },
    update,
    create: { sub, ...update },
  });

  setCredentials(res, tokens).redirect("/");
}

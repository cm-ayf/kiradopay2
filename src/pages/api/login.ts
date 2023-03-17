import { prisma } from "@/lib/prisma";
import { LoginTicket, OAuth2Client } from "google-auth-library";
import type { NextApiRequest, NextApiResponse } from "next";

const clientId = process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"]!;
if (!clientId) {
  throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
}

const client = new OAuth2Client(clientId);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (["GET", "HEAD"].includes(req.method!)) {
    res.status(400).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { credential: idToken } = req.body;
  if (typeof idToken !== "string") {
    res.status(401).end();
    return;
  }

  let ticket: LoginTicket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
  } catch (error) {
    res.status(401).end();
    return;
  }

  const payload = ticket.getPayload();
  if (!payload) {
    res.status(401).end();
    return;
  }

  const { sub, email, email_verified, name, picture } = payload;

  let user = await prisma.user.findUnique({
    where: { sub },
  });
  if (!user) {
    if (!email || !email_verified || !name) {
      res.status(401).end();
      return;
    }
    const invite = await prisma.invite.findUnique({
      where: { email },
    });
    if (!invite) {
      res.status(401).send("Not invited");
      return;
    }

    await prisma.invite.delete({
      where: { email },
    });
    user = await prisma.user.create({
      data: { sub, email, name, ...(picture && { picture }) },
    });
  }

  await prisma.session.deleteMany({
    where: { usersub: user.sub },
  });
  const until = Date.now() + 1000 * 60 * 60 * 24;
  const session = await prisma.session.create({
    data: {
      usersub: user.sub,
      until: new Date(until),
    },
  });

  const gState = {
    i_l: 1,
    i_p: until,
  };

  res
    .setHeader("Set-Cookie", [
      `sid=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
      `g_state=${JSON.stringify(gState)}; Path=/; SameSite=None; Max-Age=86400`,
    ])
    .setHeader("Clear-Site-Data", '"g_csrf_token"')
    .redirect("/");
}

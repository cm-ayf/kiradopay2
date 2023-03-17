import { prisma } from "@/lib/prisma";
import type { NextApiRequest } from "next";

export async function getSession(req: NextApiRequest) {
  const { sid } = req.cookies;
  if (!sid) return null;

  return prisma.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });
}

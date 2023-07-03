import type { NextApiRequest, NextApiResponse } from "next";
import { createHandler } from "@/lib/handler";
import { readUsersMe } from "@/types/user";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      await readUsersMeHandler(req, res);
      break;
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const readUsersMeHandler = createHandler(
  readUsersMe,
  async (_req, res, token) => {
    res.status(200).json(token);
  }
);

import { createHandler } from "@/lib/handler";
import { readUsersMe } from "@/types/user";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const GET = createHandler(readUsersMe, async ({ token }) => token);

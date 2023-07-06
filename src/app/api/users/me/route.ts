import { createHandler } from "@/lib/handler";
import { readUsersMe } from "@/types/user";

export const GET = createHandler(readUsersMe, async ({ token }) => token);

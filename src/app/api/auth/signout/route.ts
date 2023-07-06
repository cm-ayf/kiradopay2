import { NextRequest, NextResponse } from "next/server";
import { revokeToken, withCookies } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token");
  if (accessToken) {
    await revokeToken(accessToken.value).catch(() => {});
  }

  return withCookies(NextResponse.redirect(env.HOST), {
    session: "",
    access_token: "",
    refresh_token: "",
  });
}

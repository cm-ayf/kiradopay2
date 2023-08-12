import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { generateAuthUrl, withCookies } from "@/lib/auth";
import { env } from "@/lib/env";
import { OAuth2Error } from "@/shared/error";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (request.cookies.get("refresh_token")) {
    return NextResponse.redirect(new URL("/api/auth/refresh", env.HOST));
  }

  try {
    const state = randomUUID();
    const url = generateAuthUrl(state);

    return withCookies(NextResponse.redirect(url), { state });
  } catch (e) {
    const error = OAuth2Error.fromError(e);
    return NextResponse.redirect(error.toRedirectURL());
  }
}

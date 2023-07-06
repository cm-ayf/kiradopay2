import { NextRequest, NextResponse } from "next/server";
import {
  OAuth2Error,
  createSession,
  exchangeCode,
  withCookies,
} from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const stateFromQuery = request.nextUrl.searchParams.get("state");
    const stateFromCookie = request.cookies.get("state");
    if (!code || !stateFromQuery || !stateFromCookie) {
      throw new OAuth2Error("invalid_request", "missing code or state");
    }
    if (stateFromQuery !== stateFromCookie.value) {
      throw new OAuth2Error("invalid_credentials", "state mismatch");
    }

    const { access_token, refresh_token } = await exchangeCode(code);
    const session = await createSession(access_token);
    return withCookies(NextResponse.redirect(env.HOST), {
      session,
      access_token,
      refresh_token,
      state: "",
    });
  } catch (e) {
    const error = OAuth2Error.from(e);
    return withCookies(
      NextResponse.redirect(error.toRedirectURL()),
      error.code === "server_error" ? {} : { state: "" }
    );
  }
}

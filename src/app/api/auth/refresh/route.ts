import { NextRequest, NextResponse } from "next/server";
import { createSession, refreshTokens, withCookies } from "@/lib/auth";
import { env } from "@/lib/env";
import { OAuth2Error } from "@/shared/error";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get("access_token");
  const refreshToken = request.cookies.get("refresh_token");

  try {
    if (accessToken) {
      const session = await createSession(accessToken.value);
      return withCookies(NextResponse.redirect(env.HOST), { session });
    } else if (refreshToken) {
      const { access_token, refresh_token } = await refreshTokens(
        refreshToken.value,
      );
      const session = await createSession(access_token);
      return withCookies(NextResponse.redirect(env.HOST), {
        session,
        access_token,
        refresh_token,
      });
    } else {
      return withCookies(NextResponse.redirect(env.HOST), { state: "" });
    }
  } catch (e) {
    const error = OAuth2Error.fromError(e);
    return withCookies(
      NextResponse.redirect(error.toRedirectURL()),
      error.code === "server_error"
        ? {}
        : { state: "", access_token: "", refresh_token: "" },
    );
  }
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token");
  const refreshToken = request.cookies.get("refresh_token");

  try {
    if (accessToken) {
      const session = await createSession(accessToken.value);
      return withCookies(new NextResponse(null, { status: 204 }), { session });
    } else if (refreshToken) {
      const { access_token, refresh_token } = await refreshTokens(
        refreshToken.value,
      );
      const session = await createSession(access_token);
      return withCookies(new NextResponse(null, { status: 204 }), {
        session,
        access_token,
        refresh_token,
      });
    } else {
      return withCookies(new NextResponse("Signin required", { status: 401 }), {
        state: "",
      });
    }
  } catch (e) {
    const error = OAuth2Error.fromError(e);
    return withCookies(
      NextResponse.json(error, { status: error.status }),
      error.code === "server_error"
        ? {}
        : { state: "", access_token: "", refresh_token: "" },
    );
  }
}

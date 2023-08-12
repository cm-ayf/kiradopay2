import { TypeCompiler } from "@sinclair/typebox/compiler";
import { NextRequest, NextResponse } from "next/server";
import { verify } from "./auth";
import { Route } from "@/types/route";
import { Token } from "@/types/user";

type RequestData<R extends Route> = Pick<
  {
    params: Route.Params<R>;
    body: Route.Body<R>;
    token: Token;
  },
  Extract<keyof R, "params" | "body"> | "token"
>;

interface Handler<R extends Route> {
  (
    data: RequestData<R>,
    request: NextRequest,
  ): Promise<Route.Response<R> | NextResponse<Route.Response<R>>>;
}

function createPathParser<R extends Route>(route: R) {
  if (!route.params) return;
  const params = TypeCompiler.Compile(route.params);
  const regex = new RegExp(
    "^" + route.path.replace(/\[(\w+?)\]/g, "(?<$1>[\\w-]+)") + "\\/?$",
  );

  return (request: NextRequest): Route.Params<R> | undefined => {
    const match = request.nextUrl.pathname.match(regex);
    return params.Check(match?.groups) ? match?.groups : undefined;
  };
}

export function createHandler<R extends Route>(route: R, handler: Handler<R>) {
  const parser = createPathParser(route);
  const body = route.body && TypeCompiler.Compile(route.body);

  return async (request: NextRequest) => {
    if (request.method !== route.method) {
      return new NextResponse("Method not allowed", { status: 405 });
    }

    const token = await verify(request.cookies, route.scopes);
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = { token } as RequestData<R>;
    if (parser) {
      const params = parser(request);
      if (!params) return new NextResponse("Invalid params", { status: 400 });
      data.params = params;
    }
    if (body) {
      const json = await request.json();
      if (!body.Check(json))
        return new NextResponse("Invalid body", { status: 400 });
      data.body = json as Route.Body<R>;
    }

    try {
      const response = await handler(data, request);
      return response instanceof NextResponse
        ? response
        : NextResponse.json(response);
    } catch (error: any) {
      // https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
      switch (error.code) {
        case "P2001": // record does not exist
        case "P2025": // no record found
          return NextResponse.json("Record not found", { status: 404 });
        case "P2002": // unique constraint failed
        case "P2003": // foreign key constraint failed
        case "P2014": // would violate required relation
          return NextResponse.json("Database constraint failed", {
            status: 409,
          });
      }

      console.error(error);
      return NextResponse.json("Internal server error", { status: 500 });
    }
  };
}

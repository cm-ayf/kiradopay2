import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Route } from "../types/route";

export interface RouteRequest<R extends Route> extends NextApiRequest {
  method: R["method"];
  query: Route.Params<R>;
  body: Route.Body<R>;
}

export interface RouteResponse<R extends Route>
  extends NextApiResponse<Route.Response<R>> {}

export function createHandler<R extends Route>(
  route: R,
  handler: (req: RouteRequest<R>, res: RouteResponse<R>) => Promise<void>
) {
  const params = route.params && TypeCompiler.Compile(route.params);
  const body = route.body && TypeCompiler.Compile(route.body);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== route.method) {
      res.status(405).end();
      return;
    }

    if (params && !params.Check(req.query)) {
      res.status(400).end();
      return;
    }

    if (body && !body.Check(req.body)) {
      console.log(
        [...body.Errors(req.body)]
          .map(({ path, message }) => `${path}: ${message}`)
          .join("\n")
      );
      res.status(400).end();
      return;
    }

    try {
      await handler(req as RouteRequest<R>, res as RouteResponse<R>);
    } catch (error: any) {
      // https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
      switch (error.code) {
        case "P2001": // record does not exist
        case "P2025": // no record found
          res.status(404).end();
          return;
        case "P2002": // unique constraint failed
        case "P2003": // foreign key constraint failed
        case "P2014": // would violate required relation
          res.status(409).end();
          return;
      }
      console.error(error);
      res.status(500).end();
    }
  };
}

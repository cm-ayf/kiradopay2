import useSWR, { SWRConfiguration } from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";
import type { SWRResponse } from "swr";
import type { SWRMutationResponse } from "swr/mutation";
import type { Route, TParams } from "@/types/route";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Static } from "@sinclair/typebox";

type ParamsArg<P> = Static<TParams> extends P ? [params?: P] : [params: P];

type GetRoute = Route & { method: "GET" };

export type UseRoute<R extends GetRoute> = {
  (...args: ParamsArg<Route.Params<R>>): SWRResponse<Route.Response<R>, Error>;
};

export class UnauthorizedError extends Error {
  code = "UNAUTHORIZED";
}

export class InvalidResponseError extends Error {
  code = "INVALID_RESPONSE";
}

function createPathGenerator<R extends Route>(route: R) {
  return (params = {} as Route.Params<R>) =>
    route.path.replace(/\[(\w+)\]/g, (_, key: string) => params[key] as string);
}

export function createUseRoute<R extends GetRoute>(
  route: R,
  options?: SWRConfiguration<Route.Response<R>>
): UseRoute<R> {
  const pathGenerator = createPathGenerator(route);

  const response = TypeCompiler.Compile(route.response);

  async function fetcher(path: string) {
    const res = await fetch(path);
    if (res.status === 401) throw new UnauthorizedError();
    if (!res.ok) throw new Error(res.statusText);

    const json = await res.json();
    if (!response.Check(json)) throw new InvalidResponseError();

    return json;
  }

  return (...args) => useSWR(pathGenerator(...args), fetcher, options);
}

export type UseRouteMutation<R extends Route> = (
  ...args: ParamsArg<Route.Params<R>>
) => SWRMutationResponse<Route.Response<R>, any, Route.Body<R>>;

export function createUseRouteMutation<R extends Route>(
  route: R,
  options?: SWRMutationConfiguration<Route.Response<R>, any, Route.Body<R>>
): UseRouteMutation<R> {
  const pathGenerator = createPathGenerator(route);
  const response = TypeCompiler.Compile(route.response);

  async function fetcher(path: string, options: { arg: Route.Body<R> }) {
    // throws ts2589 without `as any`
    const { arg } = options as any;
    const res = await fetch(path, {
      method: route.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg),
    });

    if (res.status === 401) throw new UnauthorizedError();
    if (!res.ok) throw new Error(res.statusText);

    const json = await res.json();
    if (!response.Check(json)) throw new InvalidResponseError();

    return json;
  }

  return (...args) => useSWRMutation(pathGenerator(...args), fetcher, options);
}

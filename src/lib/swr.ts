import useSWR, { SWRConfiguration } from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";
import type { SWRResponse } from "swr";
import type { SWRMutationResponse } from "swr/mutation";
import type { Route, TParams } from "@/types/route";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { Static } from "@sinclair/typebox";
import { useAlert } from "@/components/Alert";
import { useEffect } from "react";
import { createEvent, readEvent, readEvents, updateEvent } from "@/types/event";
import { createItem, deleteItem, readItems, updateItem } from "@/types/item";
import { createReceipts, readReceipts } from "@/types/receipt";
import { createDisplay, deleteDisplay } from "@/types/display";

export class UnauthorizedError extends Error {
  code = "UNAUTHORIZED";
}

export class InvalidResponseError extends Error {
  code = "INVALID_RESPONSE";
}

type ParamsArg<P> = Static<TParams> extends P ? [params?: P] : [params: P];

type GetRoute = Route & { method: "GET" };

type UseRoute<R extends GetRoute> = {
  (...args: ParamsArg<Route.Params<R>>): SWRResponse<Route.Response<R>, Error>;
};

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
    if (res.status === 401) {
      throw new UnauthorizedError();
    }
    if (!res.ok) throw new Error(res.statusText);

    const json = await res.json();
    if (!response.Check(json)) throw new InvalidResponseError();

    return json;
  }

  return (...args) => {
    const response = useSWR(pathGenerator(...args), fetcher, options);
    const { dispatch } = useAlert();

    const isUnauthorized = response.error instanceof UnauthorizedError;

    useEffect(() => {
      if (isUnauthorized) dispatch("unauthorized");
    }, [isUnauthorized, dispatch]);

    return response;
  };
}

type UseRouteMutation<R extends Route> = (
  ...args: ParamsArg<Route.Params<R>>
) => SWRMutationResponse<Route.Response<R>, any, Route.Body<R>>;

function createUseRouteMutation<R extends Route>(
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

  return (...args) => {
    const response = useSWRMutation(pathGenerator(...args), fetcher, options);
    const { dispatch } = useAlert();

    const isUnauthorized = response.error instanceof UnauthorizedError;

    useEffect(() => {
      if (isUnauthorized) dispatch("unauthorized");
    }, [isUnauthorized, dispatch]);

    return response;
  };
}

export const useItems = createUseRoute(readItems);
export const useEvents = createUseRoute(readEvents);
export const useEvent = createUseRoute(readEvent);
export const useReceipts = createUseRoute(readReceipts);

export const useCreateItem = createUseRouteMutation(createItem);
export const useUpdateItem = createUseRouteMutation(updateItem);
export const useDeleteItem = createUseRouteMutation(deleteItem);
export const useCreateEvent = createUseRouteMutation(createEvent);
export const useUpdateEvent = createUseRouteMutation(updateEvent);
export const useCreateDisplay = createUseRouteMutation(createDisplay);
export const useDeleteDisplay = createUseRouteMutation(deleteDisplay);
export const useCreateReceipts = createUseRouteMutation(createReceipts);

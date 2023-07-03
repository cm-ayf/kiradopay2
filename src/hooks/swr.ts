import type { Static } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import useSWR, { mutate } from "swr";
import type { SWRResponse, SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import type {
  SWRMutationResponse,
  SWRMutationConfiguration,
} from "swr/mutation";
import { useWaitUntilAuthorized } from "@/hooks/UserState";
import {
  createEvent,
  deleteEvent,
  readEvent,
  readEvents,
  updateEvent,
} from "@/types/event";
import { createItem, deleteItem, readItems, updateItem } from "@/types/item";
import { createReceipts, deleteReceipts, readReceipts } from "@/types/receipt";
import type { Route, TParams } from "@/types/route";

export class UnauthorizedError extends Error {
  code = "UNAUTHORIZED" as const;
}

export class ServerError extends Error {
  code = "SERVER_ERROR" as const;
}

export class NotFoundError extends Error {
  code = "NOT_FOUND" as const;
}

export class ConflictError extends Error {
  code = "CONFLICT" as const;
}

export type RouteError =
  | UnauthorizedError
  | ServerError
  | NotFoundError
  | ConflictError;

type ParamsArg<P> = Static<TParams> extends P ? [params?: P] : [params: P];

type GetRoute = Route & { method: "GET" };

type UseRoute<R extends GetRoute> = {
  (...args: ParamsArg<Route.Params<R>>): SWRResponse<
    Route.Response<R>,
    RouteError
  >;
};

function createPathGenerator<R extends Route>(route: R) {
  return (params = {} as Route.Params<R>) =>
    route.path.replace(/\[(\w+)\]/g, (_, key: string) => params[key] as string);
}

type Fetcher<R extends Route> = R["method"] extends "GET"
  ? (path: string) => Promise<Route.Response<R>>
  : (
      path: string,
      options: { arg: Route.Body<R> }
    ) => Promise<Route.Response<R>>;

export function createFetcher<R extends Route>(route: R): Fetcher<R> {
  const response = TypeCompiler.Compile(route.response);

  return async (path: string, options?: { arg: Route.Body<R> }) => {
    const res = await fetch(path, {
      method: route.method,
      ...(options && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options.arg),
      }),
    }).catch(() => {
      throw new ServerError("Network error");
    });

    switch (res.status) {
      case 200:
      case 201:
        const json = await res.json().catch(() => {
          throw new ServerError("Invalid json");
        });
        if (!response.Check(json)) throw new ServerError("Invalid response");
        return json;
      case 204:
        return;
      case 401:
        throw new UnauthorizedError();
      case 404:
        throw new NotFoundError();
      case 409:
        throw new ConflictError();
      default:
        throw new ServerError(res.statusText);
    }
  };
}

function createUseRoute<R extends GetRoute>(
  route: R,
  config?: SWRConfiguration<Route.Response<R>, RouteError>
): UseRoute<R> {
  const pathGenerator = createPathGenerator(route);
  const fetcher = createFetcher(route);

  return (...args) => {
    const waitUntilAuthorized = useWaitUntilAuthorized();
    return useSWR(pathGenerator(...args), fetcher, {
      ...config,
      async onError(error: RouteError, key: string) {
        if (error.code !== "UNAUTHORIZED") return;
        const authorized = await waitUntilAuthorized();
        if (!authorized) return;
        mutate(key).catch(() => {});
      },
    });
  };
}

type UseRouteMutation<R extends Route> = (
  ...args: ParamsArg<Route.Params<R>>
) => SWRMutationResponse<Route.Response<R>, RouteError, string, Route.Body<R>>;

function createUseRouteMutation<R extends Route>(
  route: R,
  config?: SWRMutationConfiguration<
    Route.Response<R>,
    RouteError,
    string,
    Route.Body<R>
  >
): UseRouteMutation<R> {
  const pathGenerator = createPathGenerator(route);
  const fetcher = createFetcher(route);

  return (...args) => {
    const waitUntilAuthorized = useWaitUntilAuthorized();
    return useSWRMutation(pathGenerator(...args), fetcher, {
      ...config,
      async onError(error) {
        if (error.code !== "UNAUTHORIZED") return;
        await waitUntilAuthorized();
      },
    });
  };
}

export const useItems = createUseRoute(readItems);
export const useEvents = createUseRoute(readEvents);
export const useEvent = createUseRoute(readEvent);
export const useReceipts = createUseRoute(readReceipts, {
  refreshInterval: 10000,
});

export function useTitle(eventcode: string) {
  const { data: event } = useEvent({ eventcode });
  return event ? event.name : eventcode;
}

export const useCreateItem = createUseRouteMutation(createItem);
export const useUpdateItem = createUseRouteMutation(updateItem);
export const useDeleteItem = createUseRouteMutation(deleteItem);
export const useCreateEvent = createUseRouteMutation(createEvent);
export const useUpdateEvent = createUseRouteMutation(updateEvent);
export const useDeleteEvent = createUseRouteMutation(deleteEvent);
export const useCreateReceipts = createUseRouteMutation(createReceipts);
export const useDeleteReceipts = createUseRouteMutation(deleteReceipts);

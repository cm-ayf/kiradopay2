"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAlert } from "./Alert";
import { SigninErrorMessage } from "@/components/SigninErrorMessage";
import { SigninMessage } from "@/components/SigninMessage";
import { RouteError, useRefreshInPlace, useUsersMe } from "@/hooks/swr";
import { OAuth2Error } from "@/shared/error";
import type { Token } from "@/types/user";

export type UserState =
  | { type: "authorized"; user: Token }
  | { type: "refreshing" | "error"; user?: Token }
  | { type: "unauthorized" | "loading"; user?: never };

interface UserStateContext {
  state: UserState;
  waitUntilAuthorized: () => Promise<boolean>;
}

const UserStateContext = createContext<UserStateContext>({
  state: { type: "loading" },
  waitUntilAuthorized: () => Promise.reject(),
});

export function UserStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<UserState>({ type: "loading" });
  const inner = useRef<UserState["type"]>("loading");

  const { error } = useAlert();

  const onError = useCallback(
    async (e: RouteError) => {
      if (e.code !== "UNAUTHORIZED") {
        setState((state) => ({ ...state, type: "error" }));
        inner.current = "error";
        return;
      }

      switch (inner.current) {
        case "unauthorized":
          return;
        case "refreshing":
          setState({ type: "unauthorized" });
          inner.current = "unauthorized";
          error(<SigninMessage />);
          return;
        default:
          setState((state) => ({ ...state, type: "refreshing" }));
          inner.current = "refreshing";
          await trigger(null).catch(() => {});
          return;
      }
    },
    // `trigger` must be declared after `onError`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error],
  );

  const { mutate } = useUsersMe(undefined, {
    refreshInterval: 10000,
    onSuccess: useCallback((user: Token) => {
      setState({ type: "authorized", user });
      inner.current = "authorized";
      resolves.current.forEach((resolve) => resolve(true));
      resolves.current = [];
    }, []),
    onError,
  });
  const { trigger } = useRefreshInPlace(undefined, {
    onSuccess: useCallback(() => mutate(), [mutate]),
    onError,
  });

  const url = useMemo(() => global.location && new URL(location.href), []);

  useEffect(() => {
    if (!url?.searchParams.get("error")) return;
    setState({ type: "error" });
    inner.current = "error";

    const e = OAuth2Error.fromSearchParams(url.searchParams);
    error(<SigninErrorMessage error={e} />);
  }, [url, error]);

  const resolves = useRef<((success: boolean) => void)[]>([]);
  const waitUntilAuthorized = useCallback(async () => {
    switch (inner.current) {
      case "unauthorized":
      case "error":
        return false;
      case "authorized":
        try {
          setState((state) => ({ ...state, type: "refreshing" }));
          inner.current = "refreshing";
          await trigger(null);
          return true;
        } catch {
          return false;
        }
      case "refreshing":
      case "loading":
        return new Promise<boolean>((resolve) =>
          resolves.current.push(resolve),
        );
    }
  }, [trigger]);

  return (
    <UserStateContext.Provider value={{ state: state, waitUntilAuthorized }}>
      {children}
    </UserStateContext.Provider>
  );
}

export function useUserState() {
  const { state } = useContext(UserStateContext);
  return state;
}

export function useWritable() {
  const state = useUserState();
  if (!state.user?.scope) return false;
  return state.user.scope.split(" ").includes("write");
}

export function useWaitUntilAuthorized() {
  const { waitUntilAuthorized } = useContext(UserStateContext);
  return waitUntilAuthorized;
}

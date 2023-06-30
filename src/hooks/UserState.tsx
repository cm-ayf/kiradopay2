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
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useAlert } from "../components/Alert";
import { createFetcher, UnauthorizedError } from "@/hooks/swr";
import { readUsersMe, refreshInPlace, Token } from "@/types/user";

export type UserState =
  | { type: "authorized"; user: Token }
  | { type: "refreshing"; user?: Token }
  | { type: "unauthorized" | "loading" | "error"; user?: never };

interface UserStateContext {
  state: UserState;
  waitUntilAuthorized: () => Promise<boolean>;
}

const UserStateContext = createContext<UserStateContext>({
  state: { type: "loading" },
  waitUntilAuthorized: () => Promise.reject(),
});

const fetcher = createFetcher(readUsersMe);
const refresher = createFetcher(refreshInPlace);

export function UserStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<UserState>({ type: "loading" });
  const inner = useRef<UserState["type"]>("loading");

  const { error } = useAlert();

  const onError = useCallback(
    async (e: unknown) => {
      if (!(e instanceof UnauthorizedError)) {
        setState({ type: "error" });
        inner.current = "error";
        return;
      }

      switch (inner.current) {
        case "unauthorized":
          return;
        case "refreshing":
          setState({ type: "unauthorized" });
          inner.current = "unauthorized";
          error("サインインしてください");
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
    [error]
  );

  const { mutate } = useSWR(readUsersMe.path, fetcher, {
    refreshInterval: 10000,
    onSuccess: (user) => {
      setState({ type: "authorized", user });
      inner.current = "authorized";
      resolves.current.forEach((resolve) => resolve(true));
      resolves.current = [];
    },
    onError,
  });
  const { trigger } = useSWRMutation(refreshInPlace.path, refresher, {
    onSuccess: useCallback(() => mutate(), [mutate]),
    onError,
  });

  const url = useMemo(() => global.location && new URL(location.href), []);

  useEffect(() => {
    if (!url?.searchParams.get("error")) return;
    setState({ type: "error" });
    inner.current = "error";

    const description = url.searchParams.get("error_description");
    console.error(description);

    const message = description?.includes("Unknown Guild")
      ? "サーバーに参加していません"
      : "ログインに失敗しました";
    error(message);
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
          resolves.current.push(resolve)
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
  return (
    state.type === "authorized" &&
    (state.user.scope ?? "").split(" ").includes("write")
  );
}

export function useWaitUntilAuthorized() {
  const { waitUntilAuthorized } = useContext(UserStateContext);
  return waitUntilAuthorized;
}

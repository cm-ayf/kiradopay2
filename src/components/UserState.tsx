import { createUseRoute, UnauthorizedError } from "@/lib/swr";
import { readUsersMe, Token } from "@/types/user";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useAlert } from "./Alert";

export type UserState =
  | { type: "authorized" | "refreshing"; user: Token }
  | { type: "unauthorized" | "loading" | "error" };

interface UserStateContext {
  state: UserState;
  refresh: () => Promise<void>;
}

const UserStateContext = createContext<UserStateContext>({
  state: { type: "loading" },
  refresh: async () => {},
});

const useUser = createUseRoute(readUsersMe, { refreshInterval: 10000 });

export function UserStateProvider({ children }: PropsWithChildren) {
  const { data: user, error, mutate } = useUser();
  const { dispatch } = useAlert();

  /**
   * ```plaintext
   * user\error || undefined  | UnauthorizedError | else
   * ===========++============+===================+=======
   *  undefined || loading    | unauthorized      | error
   * -----------++------------+-------------------+-------
   *      Token || authorized | refreshing        | error
   * ```
   */
  const state: UserState = useMemo(
    () =>
      !error
        ? user
          ? { type: "authorized", user }
          : { type: "loading" }
        : error instanceof UnauthorizedError
        ? user
          ? { type: "refreshing", user }
          : { type: "unauthorized" }
        : { type: "error" },

    [user, error]
  );

  const refresh = useCallback(async () => {
    const response = await fetch("/api/auth/refresh", { method: "POST" });
    if (response.ok) {
      await mutate();
    } else {
      await mutate(undefined);
      if (response.status === 401) dispatch("unauthorized");
    }
  }, [mutate, dispatch]);

  useEffect(() => {
    if (state.type === "refreshing") refresh();
  }, [state, refresh]);

  return (
    <UserStateContext.Provider value={{ state, refresh }}>
      {children}
    </UserStateContext.Provider>
  );
}

export function useUserState() {
  const { state } = useContext(UserStateContext);
  return state;
}

export function useRefresh() {
  const { refresh } = useContext(UserStateContext);
  return refresh;
}

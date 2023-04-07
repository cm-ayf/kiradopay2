import Alert, { type AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import { createContext, useCallback, useContext, useReducer } from "react";

export type CommonAlert = keyof typeof commonAlerts;

export interface AlertData {
  severity: AlertColor;
  message: string;
}

const commonAlerts = {
  unauthorized: {
    severity: "error",
    message: "サインインしてください",
  },
} satisfies { [key: string]: AlertData };

interface AlertState extends AlertData {
  id: string;
  is?: CommonAlert;
}

type Action = AlertData | CommonAlert | { delete: string };

function reducer(state: AlertState[], action: Action): AlertState[] {
  const id = Math.random().toString(36).slice(-8);
  if (typeof action === "string") {
    const isDuplicate = state.some((alert) => alert.is === action);
    if (isDuplicate) return state;
    return [...state, { id, is: action, ...commonAlerts[action] }];
  } else if ("delete" in action) {
    return state.filter((alert) => alert.id !== action.delete);
  } else {
    return [...state, { id, ...action }];
  }
}

const AlertContext = createContext({ dispatch: (_: Action) => {} });

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, []);
  return (
    <>
      <AlertContext.Provider value={{ dispatch }}>
        {children}
      </AlertContext.Provider>
      <Stack>
        {state.map((alert) => (
          <Snackbar
            key={alert.id}
            open
            autoHideDuration={6000}
            onClose={() => dispatch({ delete: alert.id })}
          >
            <Alert
              severity={alert.severity}
              onClose={() => dispatch({ delete: alert.id })}
            >
              {alert.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </>
  );
}

export function useAlert() {
  const { dispatch } = useContext(AlertContext);
  return {
    dispatch,
    success: useCallback(
      (message: string) => dispatch({ severity: "success", message }),
      [dispatch]
    ),
    info: useCallback(
      (message: string) => dispatch({ severity: "info", message }),
      [dispatch]
    ),
    warning: useCallback(
      (message: string) => dispatch({ severity: "warning", message }),
      [dispatch]
    ),
    error: useCallback(
      (message: string) => dispatch({ severity: "error", message }),
      [dispatch]
    ),
  };
}

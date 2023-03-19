import Alert, { type AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import { createContext, useContext, useReducer } from "react";

export type CommonAlert = "unauthorized";

export interface AlertData {
  severity: AlertColor;
  message: string;
}

interface AlertState extends AlertData {
  id: string;
  is?: CommonAlert;
}

type Action = AlertData | CommonAlert | { delete: string };

function reducer(state: AlertState[], action: Action): AlertState[] {
  const id = Math.random().toString(36).slice(-8);
  if (typeof action === "string") {
    return [
      ...state.filter((alert) => alert.is !== action),
      {
        id,
        severity: "warning",
        message: "サインインしてください。",
        is: action,
      },
    ];
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
  return useContext(AlertContext);
}

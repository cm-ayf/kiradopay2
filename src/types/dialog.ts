import type { Static, TSchema } from "@sinclair/typebox";
import type { ButtonTypeMap } from "@mui/material/Button";

type Color = ButtonTypeMap["props"]["color"];

interface PlainDialogButton {
  label: string;
  needsValidation?: false;
  color?: Color;
  needsUpdate?: boolean;
  onClick: () => void | Promise<void>;
}

interface ValidatedDialogButton<T extends TSchema> {
  label: string;
  needsValidation: true;
  color?: Color;
  needsUpdate?: boolean;
  onClick: (body: Static<T>) => void | Promise<void>;
}

export type DialogButton<T extends TSchema> =
  | PlainDialogButton
  | ValidatedDialogButton<T>;

import type { Static, TSchema } from "@sinclair/typebox";

interface PlainDialogButton {
  label: string;
  needsValidation?: false;
  needsUpdate?: boolean;
  onClick: () => void | Promise<void>;
}

interface ValidatedDialogButton<T extends TSchema> {
  label: string;
  needsValidation: true;
  needsUpdate?: boolean;
  onClick: (body: Static<T>) => void | Promise<void>;
}

export type DialogButton<T extends TSchema> =
  | PlainDialogButton
  | ValidatedDialogButton<T>;

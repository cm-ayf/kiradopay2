import type { DialogButton } from "@/types/dialog";
import type { Event } from "@/types/event";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import type { TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useMemo, useState } from "react";

export default function EventDialog<T extends TSchema>({
  schema,
  title,
  event,
  open,
  onClose,
  buttons,
  isMutating,
}: {
  schema: T;
  title: string;
  event?: Event;
  open: boolean;
  onClose: () => void;
  isMutating: boolean;
  buttons: DialogButton<T>[];
}) {
  const check = useMemo(() => TypeCompiler.Compile(schema), [schema]);
  const [code, setCode] = useState(event?.code ?? "");
  const [name, setName] = useState(event?.name ?? "");
  const [date, setDate] = useState((event?.date ?? new Date()).toString());

  const body = {
    ...(event?.code !== code && { code }),
    ...(event?.name !== name && { name }),
    ...(event?.date.toString() !== date && { date }),
  };
  const isValid = check.Check(body);
  const isUpdated = Object.keys(body).length > 0;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          rowGap: 1,
        }}
      >
        <TextField
          label="イベントコード"
          variant="standard"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label="イベント名"
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="日付"
          type="date"
          variant="standard"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        {buttons.map(
          ({ onClick, label, needsValidation, needsUpdate }, index) => (
            <Button
              key={index}
              disabled={
                isMutating ||
                Boolean(needsValidation && !isValid) ||
                Boolean(needsUpdate && !isUpdated)
              }
              onClick={(e) => {
                e.preventDefault();
                if (needsValidation) {
                  if (!isValid) return;
                  onClick(body);
                } else {
                  onClick();
                }
              }}
            >
              {label}
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
}

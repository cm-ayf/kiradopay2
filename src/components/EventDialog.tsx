import LoadingButton from "@mui/lab/LoadingButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import type { TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DialogButton } from "@/types/dialog";
import type { Event } from "@/types/event";

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
  const defaultDateString = event && getISODateString(event.date);
  const todayString = getISODateString(new Date());
  const [code, setCode] = useState(event?.code ?? "");
  const [name, setName] = useState(event?.name ?? "");
  const [date, setDate] = useState(defaultDateString ?? todayString);
  const clear = useCallback(() => {
    setCode(event?.code ?? "");
    setName(event?.name ?? "");
    setDate(defaultDateString ?? todayString);
  }, [event, defaultDateString, todayString]);

  useEffect(() => {
    if (open) clear();
  }, [open, clear]);

  const body = {
    ...(event?.code !== code && { code }),
    ...(event?.name !== name && { name }),
    ...(defaultDateString !== date && { date: new Date(date) }),
  };
  const isValid = check.Check(body);
  const isUpdated = Object.keys(body).length > 0;

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        clear();
      }}
    >
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
          ({ onClick, label, color, needsValidation, needsUpdate }, index) => (
            <LoadingButton
              key={index}
              color={color ?? "primary"}
              loading={isMutating}
              disabled={
                Boolean(needsValidation && !isValid) ||
                Boolean(needsUpdate && !isUpdated)
              }
              onClick={async (e) => {
                e.preventDefault();
                try {
                  if (needsValidation) {
                    if (!isValid) return;
                    await onClick(body);
                  } else {
                    await onClick();
                  }
                  clear();
                } catch (e) {}
              }}
            >
              {label}
            </LoadingButton>
          )
        )}
      </DialogActions>
    </Dialog>
  );
}

function getISODateString(date: string | Date) {
  const [d] = new Date(date).toISOString().split("T");
  return d!;
}

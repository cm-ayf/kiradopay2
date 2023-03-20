import type { DialogButton } from "@/types/dialog";
import type { Item } from "@/types/item";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import type { TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useMemo, useState } from "react";

export default function ItemDialog<T extends TSchema>({
  schema,
  title,
  item,
  open,
  onClose,
  buttons,
  isMutating,
}: {
  schema: T;
  title: string;
  item?: Item | undefined;
  open: boolean;
  onClose: () => void;
  isMutating: boolean;
  buttons: DialogButton<T>[];
}) {
  const check = useMemo(() => TypeCompiler.Compile(schema), [schema]);
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [picture, setPicture] = useState(item?.picture ?? "");

  const body = {
    ...(item?.code !== code && { code }),
    ...(item?.name !== name && { name }),
    ...(item?.picture !== picture && { picture }),
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
          label="商品コード"
          variant="standard"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label="商品名"
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="商品画像URL"
          type="url"
          variant="standard"
          value={picture}
          onChange={(e) => setPicture(e.target.value)}
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

import CloudDone from "@mui/icons-material/CloudDone";
import CloudUpload from "@mui/icons-material/CloudUpload";
import LoadingButton, { type LoadingButtonProps } from "@mui/lab/LoadingButton";
import { useEffect } from "react";
import { useAlert } from "@/hooks/Alert";
import { useIDBDeleteReceipts, useIDBReceipts } from "@/hooks/idb";
import { useCreateReceipts } from "@/hooks/swr";

interface SyncButtonProps extends LoadingButtonProps {
  eventcode: string;
}

export function SyncButton({ eventcode, ...props }: SyncButtonProps) {
  const { data: receipts } = useIDBReceipts(eventcode);
  const { trigger: triggerCreate, isMutating: isCreating } = useCreateReceipts({
    eventcode,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } =
    useIDBDeleteReceipts(eventcode);

  const { info, error } = useAlert();

  async function onClick() {
    if (!receipts) return;
    try {
      const created = await triggerCreate(receipts);
      if (!created) return;
      await triggerDelete(created);
    } catch (e) {
      error("同期に失敗しました");
    }
  }

  useEffect(() => {
    if (receipts && receipts.length > 10) {
      info("同期されていないデータがあります");
    }
  }, [receipts, info]);

  return (
    <LoadingButton
      {...props}
      loading={isCreating || isDeleting}
      startIcon={receipts?.length ? <CloudUpload /> : <CloudDone />}
      disabled={!receipts?.length}
      onClick={onClick}
    >
      同期
    </LoadingButton>
  );
}

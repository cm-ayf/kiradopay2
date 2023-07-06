import CloudDone from "@mui/icons-material/CloudDone";
import CloudUpload from "@mui/icons-material/CloudUpload";
import LoadingButton, { type LoadingButtonProps } from "@mui/lab/LoadingButton";
import { useCallback, useEffect } from "react";
import { useAlert } from "@/hooks/Alert";
import { useIDBDeleteReceipts, useIDBReceipts } from "@/hooks/idb";
import { useCreateReceipts } from "@/hooks/swr";
import { Receipt } from "@/types/receipt";

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

  const sync = useCallback(
    async (receipts: Receipt[] | undefined) => {
      if (!receipts) return;
      try {
        const created = await triggerCreate(receipts);
        if (!created) return;
        await triggerDelete(created);
      } catch (e) {
        error("同期に失敗しました");
      }
    },
    [triggerCreate, triggerDelete, error]
  );

  useEffect(() => {
    if (receipts && receipts.length > 10) {
      info("同期されていないデータがあります");
    }
  }, [receipts, info]);

  useEffect(() => {
    const id = setTimeout(sync, 5000, receipts);
    return () => clearTimeout(id);
  }, [receipts, sync]);

  return (
    <LoadingButton
      {...props}
      loading={isCreating || isDeleting}
      startIcon={receipts?.length ? <CloudUpload /> : <CloudDone />}
      disabled={!receipts?.length}
      onClick={() => sync(receipts)}
    >
      同期
    </LoadingButton>
  );
}

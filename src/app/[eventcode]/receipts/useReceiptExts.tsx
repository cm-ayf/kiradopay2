import { useMemo } from "react";
import { useIDBReceipts } from "@/hooks/idb";
import { useReceipts } from "@/hooks/swr";
import type { Receipt } from "@/types/receipt";

export interface ReceiptExt extends Receipt {
  onServer: boolean;
}

export default function useReceiptExts(eventcode: string) {
  const { data: onServer, mutate: mutateServer } = useReceipts(
    { eventcode },
    { refreshInterval: 10000 },
  );
  const { data: onBrowser, mutate: mutateBrowser } = useIDBReceipts(eventcode);
  const receipts = useMemo<ReceiptExt[] | undefined>(
    () =>
      onServer &&
      onBrowser && [
        ...onServer.map((receipt) => ({ ...receipt, onServer: true })),
        ...onBrowser.map((receipt) => ({ ...receipt, onServer: false })),
      ],
    [onServer, onBrowser],
  );
  async function reload() {
    await Promise.all([mutateServer(), mutateBrowser()]);
  }

  return { receipts, reload };
}

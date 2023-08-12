import LoadingButton from "@mui/lab/LoadingButton";
import CircularProgress from "@mui/material/CircularProgress";
import { Box } from "@mui/system";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import useReceiptExts, { ReceiptExt } from "./useReceiptExts";
import { SyncButton } from "@/components/SyncButton";
import { useAlert } from "@/hooks/Alert";
import { useWritable } from "@/hooks/UserState";
import { useIDBDeleteReceipts } from "@/hooks/idb";
import { useDeleteReceipts, useEvent } from "@/hooks/swr";

export default function Table({ eventcode }: { eventcode: string }) {
  const columns = useColumns(eventcode);
  const { receipts, reload } = useReceiptExts(eventcode);
  const { trigger: triggerServer, isMutating: isDeletingServer } =
    useDeleteReceipts({ eventcode });
  const { trigger: triggerBrowser, isMutating: isDeletingBrowser } =
    useIDBDeleteReceipts(eventcode);
  const { error } = useAlert();
  const writable = useWritable();
  const [selected, setSelected] = useState<string[]>([]);

  async function onClickDelete() {
    const rowsToDelete = receipts?.filter(({ id }) => selected.includes(id));
    if (!rowsToDelete?.length) return;

    const serverRows = rowsToDelete.filter(({ onServer }) => onServer);
    const browserRows = rowsToDelete.filter(({ onServer }) => !onServer);

    try {
      await Promise.all([
        serverRows.length && triggerServer(serverRows.map(({ id }) => id)),
        browserRows.length && triggerBrowser(browserRows),
      ]);
      await reload();
    } catch (e) {
      error("履歴の削除に失敗しました");
    }
  }

  if (!receipts) return <CircularProgress />;

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Box sx={{ flex: 1 }}>
        <DataGrid
          rows={receipts.map(toRow)}
          columns={columns}
          checkboxSelection={writable}
          getRowId={(row) => row.id}
          rowSelectionModel={selected}
          onRowSelectionModelChange={(selected) =>
            setSelected(selected.map(String))
          }
        />
      </Box>
      {writable && (
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
          <LoadingButton
            variant="contained"
            onClick={onClickDelete}
            disabled={selected.length === 0}
            loading={isDeletingServer || isDeletingBrowser}
          >
            履歴を削除
          </LoadingButton>
          <SyncButton eventcode={eventcode} variant="contained" />
        </Box>
      )}
    </Box>
  );
}

function useColumns(eventcode: string) {
  const { data: event } = useEvent({ eventcode });
  return useMemo<GridColDef[]>(
    () => [
      {
        field: "createdAt",
        headerName: "時刻",
        width: 160,
        valueGetter: ({ value }) => value.toLocaleString("ja-JP"),
      },
      { field: "total", headerName: "合計", width: 90, align: "right" },
      { field: "onServer", headerName: "同期", width: 90, align: "center" },
      ...(event?.items.map<GridColDef>(({ code, name }) => ({
        field: code,
        headerName: name,
        width: 160,
        align: "right",
      })) ?? []),
    ],
    [event],
  );
}

function toRow({ records, createdAt, onServer, ...rest }: ReceiptExt) {
  return {
    ...rest,
    createdAt: new Date(createdAt),
    onServer,
    ...Object.fromEntries(
      records.map(({ itemcode, count }) => [itemcode, count]),
    ),
  };
}

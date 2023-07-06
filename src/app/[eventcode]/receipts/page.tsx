"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import { Box } from "@mui/system";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { SyncButton } from "@/components/SyncButton";
import { useAlert } from "@/hooks/Alert";
import { DBStateProvider } from "@/hooks/DBState";
import { useWritable } from "@/hooks/UserState";
import { useIDBDeleteReceipts, useIDBReceipts } from "@/hooks/idb";
import {
  useDeleteReceipts,
  useEvent,
  useReceipts,
  useTitle,
} from "@/hooks/swr";
import type { Receipt } from "@/types/receipt";

export const dynamic = "force-static";

export default function Receipts({
  params: { eventcode },
}: {
  params: { eventcode: string };
}) {
  const title = useTitle(eventcode);
  const [tab, setTab] = useState("summary");

  return (
    <DBStateProvider>
      <Layout title={title} back={`/${eventcode}`}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="概要" value="summary" />
          <Tab label="表" value="table" />
          <Tab label="出力" value="export" />
        </Tabs>
        <TabContext value={tab}>
          <TabPanel value="summary">
            <ReceiptSummary eventcode={eventcode} />
          </TabPanel>
          <TabPanel value="table" sx={{ flex: 1 }}>
            <ReceiptTable eventcode={eventcode} />
          </TabPanel>
          <TabPanel value="export">
            <ReceiptExport eventcode={eventcode} />
          </TabPanel>
        </TabContext>
      </Layout>
    </DBStateProvider>
  );
}

interface ReceiptExt extends Receipt {
  onServer: boolean;
}

function useReceiptExts(eventcode: string) {
  const { data: onServer, mutate: mutateServer } = useReceipts(
    { eventcode },
    { refreshInterval: 10000 }
  );
  const { data: onBrowser, mutate: mutateBrowser } = useIDBReceipts(eventcode);
  const receipts = useMemo<ReceiptExt[] | undefined>(
    () =>
      onServer &&
      onBrowser && [
        ...onServer.map((receipt) => ({ ...receipt, onServer: true })),
        ...onBrowser.map((receipt) => ({ ...receipt, onServer: false })),
      ],
    [onServer, onBrowser]
  );
  async function reload() {
    await Promise.all([mutateServer(), mutateBrowser()]);
  }

  return { receipts, reload };
}

function useTotal(receipts: ReceiptExt[]) {
  return useMemo(
    () => receipts.reduce((t, { total }) => t + total, 0),
    [receipts]
  );
}

function useCounts(receipts: ReceiptExt[]) {
  return useMemo(() => {
    const counts: { [itemcode: string]: number } = {};
    for (const receipt of receipts) {
      for (const { itemcode, count } of receipt.records) {
        counts[itemcode] = (counts[itemcode] ?? 0) + count;
      }
    }
    return counts;
  }, [receipts]);
}

function ReceiptSummary({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const { receipts } = useReceiptExts(eventcode);
  const total = useTotal(receipts ?? []);
  const counts = useCounts(receipts ?? []);

  if (!event || !receipts) return <CircularProgress />;

  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>売上</TableCell>
          <TableCell>
            {total
              .toLocaleString("ja-JP", {
                style: "currency",
                currency: "JPY",
              })
              .replace("￥", "¥")}
          </TableCell>
        </TableRow>
        {event?.items.map(({ code, name }) => (
          <TableRow key={code}>
            <TableCell>頒布数：{name}</TableCell>
            <TableCell>{counts[code] ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
    [event]
  );
}

function toRow({ records, createdAt, onServer, ...rest }: ReceiptExt) {
  return {
    ...rest,
    createdAt: new Date(createdAt),
    onServer,
    ...Object.fromEntries(
      records.map(({ itemcode, count }) => [itemcode, count])
    ),
  };
}

function ReceiptTable({ eventcode }: { eventcode: string }) {
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

function ReceiptExport({ eventcode }: { eventcode: string }) {
  return (
    <Button
      variant="contained"
      href={`/api/events/${eventcode}/receipts/export`}
    >
      CSV
    </Button>
  );
}

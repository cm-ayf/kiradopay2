import Layout from "@/components/Layout";
import { useIDBReceipts } from "@/hooks/idb";
import { useEvent, useReceipts, useTitle } from "@/hooks/swr";
import type { Receipt } from "@/types/receipt";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Button from "@mui/material/Button";

// export { eventScoped as getServerSideProps } from "@/lib/ssr";

export default function ReceiptsWrapper() {
  const router = useRouter();
  const { eventcode } = router.query;
  if (typeof eventcode !== "string") return null;

  return <Receipts eventcode={eventcode} />;
}

function Receipts({ eventcode }: { eventcode: string }) {
  const title = useTitle(eventcode);
  const [tab, setTab] = useState("summary");

  return (
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
  );
}

interface ReceiptExt extends Receipt {
  onServer: boolean;
}

function useReceiptExts(eventcode: string) {
  const { data: onServer } = useReceipts({ eventcode });
  const { data: onBrowser } = useIDBReceipts(eventcode);
  return useMemo<ReceiptExt[] | undefined>(
    () =>
      onServer &&
      onBrowser && [
        ...onServer.map((receipt) => ({ ...receipt, onServer: true })),
        ...onBrowser.map((receipt) => ({ ...receipt, onServer: false })),
      ],
    [onServer, onBrowser]
  );
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
  const receipts = useReceiptExts(eventcode);
  const total = useTotal(receipts ?? []);
  const counts = useCounts(receipts ?? []);

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
  const receipts = useReceiptExts(eventcode);

  return <DataGrid rows={receipts?.map(toRow) ?? []} columns={columns} />;
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

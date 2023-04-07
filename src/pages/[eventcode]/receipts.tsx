import Layout from "@/components/Layout";
import { verify } from "@/lib/auth";
import { useIDBReceipts } from "@/lib/idb";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { useEvent, useReceipts, useTitle } from "@/lib/swr";
import type { Receipt } from "@/types/receipt";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

export async function getServerSideProps({
  req,
  params,
}: GetServerSidePropsContext<{ eventcode: string }>) {
  const token = verify(req);
  if (!token) return { props: {} };

  const { eventcode } = params!;
  const event = await prisma.event.findUnique({
    where: { code: eventcode },
    include: {
      ...eventInclude,
      receipts: {
        include: { records: true },
      },
    },
  });

  if (!event) return { notFound: true };

  const { receipts, ...rest } = event;
  return {
    props: {
      fallback: {
        "/api/users/me": token,
        [`/api/events/${eventcode}`]: toEvent(rest),
        [`/api/events/${eventcode}/receipts`]: receipts,
      },
    },
  };
}

export default function ReceiptsWrapper() {
  const router = useRouter();
  const { eventcode } = router.query;
  if (typeof eventcode !== "string") return null;

  return <Receipts eventcode={eventcode} />;
}

function Receipts({ eventcode }: { eventcode: string }) {
  const title = useTitle(eventcode);

  return (
    <Layout title={title} back={`/${eventcode}`}>
      {event && <ReceiptTable eventcode={eventcode} />}
    </Layout>
  );
}

const basicColumns: GridColDef[] = [
  {
    field: "createdAt",
    headerName: "時刻",
    width: 160,
    valueGetter: ({ value }) => value.toLocaleString("ja-JP"),
  },
  { field: "total", headerName: "合計", width: 90, align: "right" },
  { field: "onServer", headerName: "同期", width: 90, align: "center" },
];

function flat(receipt: Receipt, onServer: boolean) {
  const { records, createdAt, ...rest } = receipt;
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
  const { data: event } = useEvent({ eventcode });
  const { data: onServer } = useReceipts({ eventcode });
  const { data: onBrowser } = useIDBReceipts(eventcode);
  const columns = useMemo(
    () => [
      ...basicColumns,
      ...(event?.items.map<GridColDef>(({ code, name }) => ({
        field: code,
        headerName: name,
        width: 160,
        align: "right",
      })) ?? []),
    ],
    [event?.items]
  );
  const rows = useMemo(
    () => [
      ...(onServer || []).map((receipt) => flat(receipt, true)),
      ...(onBrowser || []).map((receipt) => flat(receipt, false)),
    ],
    [onServer, onBrowser]
  );

  return <DataGrid rows={rows} columns={columns} />;
}

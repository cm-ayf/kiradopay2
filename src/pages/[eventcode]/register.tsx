import Layout from "@/components/Layout";
import { verify } from "@/lib/auth";
import { idb } from "@/lib/idb";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { Event, readEvent } from "@/types/event";
import type { Item } from "@/types/item";
import { Receipt as ReceiptSchema, createReceipts } from "@/types/receipt";
import { readReceipts } from "@/types/receipt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useCallback, useMemo, useReducer, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export async function getServerSideProps({
  req,
  params,
}: GetServerSidePropsContext<{ eventcode: string }>) {
  const token = verify(req);
  if (!token) return { props: {} };

  const { eventcode } = params!;
  const event = await prisma.event.findUnique({
    where: { code: eventcode },
    include: eventInclude,
  });

  if (!event) return { notFound: true };

  return {
    props: {
      fallback: {
        "/api/users/me": token,
        [`/api/events/${eventcode}`]: toEvent(event),
      },
    },
  };
}

export default function RegisterWrapper() {
  const router = useRouter();
  const { eventcode } = router.query;
  if (typeof eventcode !== "string") return null;

  return <Register eventcode={eventcode} />;
}

interface UpsertRecord {
  type: "upsert";
  itemcode: string;
  create: RecordState;
  update: Partial<RecordState>;
}

interface DeleteRecord {
  type: "delete";
  itemcode: string;
}

interface Reset {
  type: "reset";
}

type Action = UpsertRecord | DeleteRecord | Reset;

interface RecordState {
  count: number;
  dedication?: boolean;
}

type State = {
  [itemcode: string]: RecordState;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "upsert":
      const existing = state[action.itemcode];
      return {
        ...state,
        [action.itemcode]: existing
          ? { ...existing, ...action.update }
          : action.create,
      };
    case "delete":
      const { [action.itemcode]: _, ...rest } = state;
      return rest;
    case "reset":
      return {};
  }
}

const useEvent = createUseRoute(readEvent);

function Register({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const [state, dispatch] = useReducer(reducer, {});
  const title = event ? event.name : eventcode;

  return (
    <Layout
      headTitle={`${title} | Kiradopay`}
      bodyTitle={title}
      back={`/${eventcode}`}
      bottom={
        event && <Bottom event={event} state={state} dispatch={dispatch} />
      }
    >
      <Container
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridGap: 2,
        }}
      >
        {event?.items.map((item) => (
          <ItemCard
            key={item.code}
            item={item}
            record={state[item.code]}
            dispatch={dispatch}
          />
        ))}
      </Container>
    </Layout>
  );
}

function Bottom({
  event,
  state,
  dispatch,
}: {
  event: Event;
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const calculator = useCalculator(event);
  const total = calculator(state);

  const { trigger } = useSWRMutation("idb:receipts", register);

  function register(_: string, { arg }: { arg: State }) {
    const records = Object.entries(arg).map(([itemcode, record]) => ({
      itemcode,
      count: record.count,
      dedication: record.dedication ?? false,
    }));
    return idb.addReceipt(event.code, total, records);
  }

  async function onClick() {
    await trigger(state);
    dispatch({ type: "reset" });
  }

  return (
    <Paper variant="outlined" square sx={{ py: 1 }}>
      <Container
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          rowGap: 1,
        }}
      >
        <Receipts event={event} />
        <Box sx={{ flexGrow: 1 }} />
        <Price total={total} />
        <Button
          variant="contained"
          disabled={Object.keys(state).length === 0}
          onClick={onClick}
          sx={{ px: 4, my: 0.5 }}
        >
          登録
        </Button>
      </Container>
    </Paper>
  );
}

function Price({ total }: { total: number }) {
  const hints =
    total > 0
      ? [10000, 5000, 1000, 500]
          .filter((r) => r >= total)
          .map((r) => ({ receive: r, change: r - total }))
      : [];

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridGap: 1,
        }}
      >
        {hints.map((hint) => (
          <Box
            key={hint.receive}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Typography variant="caption">
              ¥{hint.receive} → ¥{hint.change}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: 0.5,
        }}
      >
        <Typography variant="caption">合計金額</Typography>
        <Typography variant="caption">¥ {total}</Typography>
      </Box>
    </>
  );
}

type Calculator = (state: State) => number;

function useCalculator({ calculator, items }: Event): Calculator {
  return useMemo(() => {
    const raw = new Function("state", calculator) as Calculator;
    const defaults = Object.fromEntries(
      items.map((item) => [item.code, { count: 0 }])
    );
    return (state) => raw({ ...defaults, ...state });
  }, [calculator, items]);
}

type Value = 0 | 1 | "+";

function ItemCard({
  item,
  record,
  dispatch,
}: {
  item: Item;
  record: RecordState | undefined;
  dispatch: React.Dispatch<Action>;
}) {
  const count = record?.count ?? 0;
  const value: Value = count === 0 || count === 1 ? count : "+";

  const set = useCallback(
    (count: number) =>
      dispatch({
        type: "upsert",
        itemcode: item.code,
        create: { count },
        update: { count },
      }),
    [dispatch, item.code]
  );

  function onChange(_: unknown, value: Value) {
    switch (value) {
      case 0:
        dispatch({ type: "delete", itemcode: item.code });
        break;
      case 1:
        set(1);
        break;
      case "+":
        set(2);
        break;
    }
  }

  function onPlus() {
    if (value === "+") set(count + 1);
  }

  return (
    <Card key={item.code} sx={{ display: "flex" }}>
      <CardMedia
        component="img"
        sx={{ width: 151 }}
        image={item.picture}
        alt={item.name}
      />
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <CardContent>
          <Typography component="div" variant="h5">
            {item.name}
          </Typography>
        </CardContent>
        <Box
          sx={{
            display: "flex",
            mt: "auto",
            mb: "auto",
            ml: 2,
            mr: 2,
            columnGap: 2,
            height: 54,
          }}
        >
          <ToggleButtonGroup
            value={value}
            exclusive
            onChange={onChange}
            sx={{ height: "100%" }}
          >
            <ToggleButton value={0}>0</ToggleButton>
            <ToggleButton value={1}>1</ToggleButton>
            <ToggleButton value={"+"} onClick={onPlus}>
              +
            </ToggleButton>
          </ToggleButtonGroup>
          {value === "+" && (
            <TextField
              type="number"
              value={count}
              onChange={(e) => set(parseInt(e.target.value))}
              sx={{ height: "100%" }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
}

const useReceipts = createUseRoute(readReceipts);
const useIDBReceipts = ({ eventcode }: { eventcode: string }) =>
  useSWR(`idb:receipts:${eventcode}`, (key) => {
    const [, , eventcode] = key.split(":");
    return idb.getReceipts(eventcode!);
  });

function Receipts({ event }: { event: Event }) {
  const { data: onServer } = useReceipts({ eventcode: event.code });
  const { data: onBrowser } = useIDBReceipts({ eventcode: event.code });

  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>購入履歴</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        scroll="paper"
        sx={{
          "& .MuiDialog-paper": {
            width: "30%",
            maxWidth: "none",
          },
        }}
      >
        <DialogTitle>購入履歴</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption">ブラウザの履歴</Typography>
          {onBrowser &&
            sorted(onBrowser).map((receipt) => (
              <Receipt key={receipt.id} receipt={receipt} items={event.items} />
            ))}
          <Divider />
          <Typography variant="caption">サーバーの履歴</Typography>
          {onServer &&
            sorted(onServer).map((receipt) => (
              <Receipt key={receipt.id} receipt={receipt} items={event.items} />
            ))}
        </DialogContent>
        <DialogActions sx={{ display: "flex" }}>
          <Dump eventcode={event.code} />
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Receipt({
  receipt,
  items,
}: {
  receipt: ReceiptSchema;
  items: Item[];
}) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        rowGap: 1,
        p: 1,
      }}
    >
      <Typography variant="caption">
        {receipt.createdAt.toLocaleString()}
      </Typography>
      <Typography variant="caption">¥ {receipt.total}</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", rowGap: 1 }}>
        {receipt.records.map((record) => {
          const item = items.find((i) => i.code === record.itemcode);

          return (
            <Typography variant="caption" key={record.itemcode}>
              {record.count} × {item?.name ?? record.itemcode}
            </Typography>
          );
        })}
      </Box>
    </Card>
  );
}

function sorted<T extends { createdAt: string | Date }>([...items]: T[]): T[] {
  return items.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

function getTime(date: string | Date) {
  return typeof date === "string" ? Date.parse(date) : date.getTime();
}

const useCreateReceipts = createUseRouteMutation(createReceipts);

function Dump({ eventcode }: { eventcode: string }) {
  const { trigger } = useCreateReceipts({ eventcode });
  const { data: receipts, mutate } = useIDBReceipts({ eventcode });

  async function onClick() {
    if (!receipts) return;
    await trigger(receipts);
    await mutate(idb.deleteReceipts(eventcode), false);
  }

  return (
    <Button onClick={onClick} disabled={!receipts}>
      アップロード
    </Button>
  );
}

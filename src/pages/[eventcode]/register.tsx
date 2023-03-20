import { useAlert } from "@/components/Alert";
import Layout from "@/components/Layout";
import { verify } from "@/lib/auth";
import {
  useIDBCreateReceipt,
  useIDBDeleteReceipts,
  useIDBReceipts,
} from "@/lib/idb";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { Event, readEvent } from "@/types/event";
import type { Item } from "@/types/item";
import { createReceipts } from "@/types/receipt";
import CloudDone from "@mui/icons-material/CloudDone";
import CloudUpload from "@mui/icons-material/CloudUpload";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useReducer } from "react";

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

interface RecordSetCount {
  type: "setCount";
  itemcode: string;
  count: number;
}

interface RecordSetDedication {
  type: "setDedication";
  itemcode: string;
  dedication: boolean;
}

interface Reset {
  type: "reset";
}

type Action = RecordSetCount | RecordSetDedication | Reset;

interface RecordState {
  count: number;
  dedication?: boolean;
}

type State = {
  [itemcode: string]: RecordState;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setCount": {
      const { itemcode, count } = action;
      if (count > 0) {
        const updated: RecordState = { ...state[itemcode], count };
        return { ...state, [itemcode]: updated };
      } else if (count === 0) {
        const { [itemcode]: _, ...rest } = state;
        return rest;
      } else {
        return state;
      }
    }
    case "setDedication": {
      const { itemcode, dedication } = action;
      const updated: RecordState = { count: 1, ...state[itemcode], dedication };
      return { ...state, [itemcode]: updated };
    }
    case "reset": {
      return {};
    }
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
      <Grid container spacing={2} sx={{ flex: 1 }}>
        {event?.items.map((item) => (
          <Grid item flex={1} key={item.code} sx={{ alignItems: "center" }}>
            <ItemPanel
              item={item}
              record={state[item.code]}
              dispatch={dispatch}
            />
          </Grid>
        ))}
      </Grid>
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
  const { trigger: triggerCreate, isMutating: isCreating } =
    useIDBCreateReceipt(event.code);
  const calculator = useCalculator(event);
  const total = calculator(state);
  const hints =
    total > 0
      ? [500, 1000, 5000, 10000]
          .filter((r) => r >= total)
          .map((r) => ({ receive: r, change: r - total }))
      : [];

  async function onClick() {
    const records = Object.entries(state).map(([itemcode, record]) => ({
      itemcode,
      count: record.count,
      dedication: record.dedication ?? false,
    }));
    await triggerCreate({ total, records });
    dispatch({ type: "reset" });
  }

  const {
    trigger: triggerSync,
    isMutating: isSyncing,
    pending,
  } = useSync(event.code);
  const pending10 = Boolean(pending && pending >= 10);
  const { dispatch: dispatchAlert } = useAlert();

  useEffect(() => {
    if (pending10) {
      dispatchAlert({
        severity: "info",
        message: "同期されていないデータがあります",
      });
    }
  }, [pending10, dispatchAlert]);

  return (
    <Paper variant="outlined" square sx={{ height: 144 }}>
      <Container
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          columnGap: 2,
        }}
      >
        <LoadingButton
          size="large"
          variant="outlined"
          loading={isSyncing}
          startIcon={pending ? <CloudUpload /> : <CloudDone />}
          disabled={!pending}
          onClick={triggerSync}
        >
          同期
        </LoadingButton>
        <Box sx={{ flex: 1 }} />
        <Table size="small" sx={{ flex: 0 }}>
          <TableBody sx={{ rowGap: 0 }}>
            {hints.map(({ receive, change }) => (
              <TableRow key={receive}>
                <TableCell>¥{receive}</TableCell>
                <TableCell>→</TableCell>
                <TableCell>¥{change}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="caption" fontSize="3em" sx={{ p: 2, width: 192 }}>
          ¥{total}
        </Typography>
        <LoadingButton
          size="large"
          variant="contained"
          loading={isCreating}
          disabled={Object.keys(state).length === 0}
          onClick={onClick}
        >
          登録
        </LoadingButton>
      </Container>
    </Paper>
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

const useCreateReceipts = createUseRouteMutation(createReceipts);

function useSync(eventcode: string) {
  const { data: receipts } = useIDBReceipts(eventcode);
  const { trigger: triggerCreate, isMutating: isCreating } = useCreateReceipts({
    eventcode,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } =
    useIDBDeleteReceipts(eventcode);

  return {
    pending: receipts?.length,
    trigger: useCallback(async () => {
      if (!receipts) return;
      const created = await triggerCreate(receipts);
      if (!created) return;
      await triggerDelete(receipts);
    }, [triggerCreate, triggerDelete, receipts]),
    isMutating: isCreating || isDeleting,
  };
}

function ItemPanel({
  item,
  record,
  dispatch,
}: {
  item: Item;
  record: RecordState | undefined;
  dispatch: React.Dispatch<Action>;
}) {
  const setCount = useCallback(
    (count: number) =>
      dispatch({ type: "setCount", itemcode: item.code, count }),
    [dispatch, item.code]
  );

  const setDedication = useCallback(
    (dedication: boolean) =>
      dispatch({ type: "setDedication", itemcode: item.code, dedication }),
    [dispatch, item.code]
  );

  return (
    <Card key={item.code} sx={{ display: "flex", width: 450 }}>
      <CardMedia
        component="img"
        image={item.picture}
        alt={item.name}
        sx={{ width: 150 }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <CardContent sx={{ fontSize: "1.5em" }}>{item.name}</CardContent>
        <Box sx={{ flex: 1 }} />
        <CardActions
          sx={{
            m: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <DedicationCheck
            selected={record?.dedication ?? false}
            onChange={setDedication}
          />
          <Counter count={record?.count ?? 0} onChange={setCount} />
        </CardActions>
      </Box>
    </Card>
  );
}

function DedicationCheck({
  selected,
  onChange,
}: {
  selected: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <FormControlLabel
      sx={{ mx: 2 }}
      control={
        <Checkbox
          checked={selected}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
      label="献本"
    />
  );
}

type Value = 0 | 1 | "+";

function Counter({
  count,
  onChange,
}: {
  count: number;
  onChange: (count: number) => void;
}) {
  const value = count === 0 || count === 1 ? count : "+";

  return (
    <Box sx={{ height: 56, mx: 2, mb: 2, display: "flex", columnGap: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, v: Value | null) => {
          if (v !== null) onChange({ 0: 0, 1: 1, "+": 2 }[v]);
          else if (value === "+") onChange(count + 1);
        }}
        sx={{ height: "100%", display: "flex", flexDirection: "row" }}
      >
        <ToggleButton size="large" value={0}>
          0
        </ToggleButton>
        <ToggleButton size="large" value={1}>
          1
        </ToggleButton>
        <ToggleButton size="large" value={"+"}>
          +
        </ToggleButton>
      </ToggleButtonGroup>
      <TextField
        type="number"
        value={count}
        onChange={(e) => onChange(parseInt(e.target.value))}
        sx={{ height: "100%", width: 56 }}
      />
    </Box>
  );
}

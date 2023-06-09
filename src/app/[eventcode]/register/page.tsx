"use client";

import Error from "@mui/icons-material/Error";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
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
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useMemo, useReducer } from "react";
import Layout from "@/components/Layout";
import { SyncButton } from "@/components/SyncButton";
import { useAlert } from "@/hooks/Alert";
import { DBStateProvider, useDBState } from "@/hooks/DBState";
import { useIDBCreateReceipt } from "@/hooks/idb";
import { useEvent } from "@/hooks/swr";
import type { Event } from "@/types/event";
import type { Item } from "@/types/item";

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

export const dynamic = "force-static";

export default function Register({
  params: { eventcode },
}: {
  params: { eventcode: string };
}) {
  const { data: event } = useEvent({ eventcode });
  const [state, dispatch] = useReducer(reducer, {});
  const title = event ? event.name : eventcode;

  return (
    <DBStateProvider>
      <Layout
        title={title}
        back={`/${eventcode}`}
        bottom={
          event && <Bottom event={event} state={state} dispatch={dispatch} />
        }
      >
        {event ? (
          <Grid container spacing={2}>
            {event.items.map((item) => (
              <Grid item xs={12} md={6} xl={4} key={item.code}>
                <ItemPanel
                  item={item}
                  record={state[item.code]}
                  dispatch={dispatch}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <CircularProgress />
        )}
      </Layout>
    </DBStateProvider>
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
  const dbState = useDBState();
  const { trigger: triggerCreate, isMutating: isCreating } =
    useIDBCreateReceipt(event.code);
  const { error } = useAlert();
  const calculator = useCalculator(event);
  const total = calculator(state);

  async function onClickCreate() {
    if (isNaN(total)) return;
    const records = Object.entries(state).map(([itemcode, record]) => ({
      itemcode,
      count: record.count,
      dedication: record.dedication ?? false,
    }));
    try {
      await triggerCreate({ total, records });
      dispatch({ type: "reset" });
    } catch (e) {
      error("登録に失敗しました");
    }
  }

  return (
    <Paper
      variant="outlined"
      square
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        px: 2,
      }}
    >
      <SyncButton eventcode={event.code} size="large" variant="outlined" />
      <Box sx={{ flex: 1 }} />
      <Tooltip title={<PriceTable total={total} />} placement="top-start">
        <Typography variant="caption" px={2} fontSize="3em">
          {isNaN(total) ? "エラー" : `¥${total}`}
        </Typography>
      </Tooltip>
      <LoadingButton
        size="large"
        variant="contained"
        loading={dbState.type === "opening" || isCreating}
        startIcon={dbState.type === "error" && <Error />}
        disabled={
          dbState.type !== "available" ||
          Object.keys(state).length === 0 ||
          isNaN(total)
        }
        onClick={onClickCreate}
      >
        登録
      </LoadingButton>
    </Paper>
  );
}

function PriceTable({ total }: { total: number }) {
  const hints =
    total > 0
      ? [500, 1000, 5000, 10000]
          .filter((r) => r >= total)
          .map((r) => ({ receive: r, change: r - total }))
      : [];

  return (
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
  );
}

type Calculator = (state: State) => number;

function useCalculator({ calculator, items }: Event): Calculator {
  return useMemo(() => {
    const raw = new Function("state", calculator) as (state: State) => unknown;
    const defaults = Object.fromEntries(
      items.map((item) => [item.code, { count: 0 }])
    );
    return (state) => Number(raw({ ...defaults, ...state }));
  }, [calculator, items]);
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
    <Card key={item.code} sx={{ width: "100%", display: "flex" }}>
      <CardMedia
        component="img"
        image={item.picture}
        alt={item.name}
        sx={{ width: 150 }}
      />
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ fontSize: "1.5em" }}>{item.name}</CardContent>
        <Box sx={{ flex: 1 }} />
        <CardActions
          sx={{
            p: 0,
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

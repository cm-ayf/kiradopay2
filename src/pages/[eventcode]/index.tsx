import Layout from "@/components/Layout";
import { prisma } from "@/lib/prisma";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { createDisplay, deleteDisplay } from "@/types/display";
import { readEvent, updateEvent, Event as EventSchema } from "@/types/event";
import { readItems, Item as ItemSchema } from "@/types/item";
import { Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { compressToEncodedURIComponent } from "lz-string";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useSWRConfig } from "swr";

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ eventcode: string }>
) {
  const { eventcode } = context.params!;
  const event = await prisma.event.findUnique({
    where: { code: eventcode },
    include: {
      displays: {
        include: { item: true },
      },
    },
  });

  if (!event) return { notFound: true };

  return {
    props: {
      fallback: {
        [`/api/events/${eventcode}`]: {
          ...event,
          date: event.date.toISOString(),
          items: event.displays.map(({ item }) => item),
        },
      },
    },
  };
}

const useEvent = createUseRoute(readEvent);

export default function EventWrapper() {
  const router = useRouter();
  const { eventcode } = router.query;
  if (typeof eventcode !== "string") return null;

  return <Event eventcode={eventcode} />;
}

function isValidCalculator(calculator: string) {
  try {
    new Function("state", calculator);
    return true;
  } catch {
    return false;
  }
}

function Event({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const title = event ? event.name : eventcode;

  return (
    <Layout headTitle={`${title} | Kiradopay`} bodyTitle={title} back="/">
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          {title}
        </Typography>
        {event && <UpdateEvent event={event} />}
      </Box>
      {event && <UpdateCalculator event={event} />}
      {event && <DisplayArray event={event} />}
    </Layout>
  );
}

const useUpdateEvent = createUseRouteMutation(updateEvent);

function UpdateEvent({ event }: { event: EventSchema }) {
  const { trigger, isMutating } = useUpdateEvent({ eventcode: event.code });

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string>();
  const [name, setName] = useState<string>();
  const [date, setDate] = useState<string>();

  const body = {
    ...(code && { code }),
    ...(name && { name }),
    ...(date && { date }),
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        sx={{ fontSize: "1.5em", lineHeight: "normal", py: 1 }}
      >
        <Edit />
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            rowGap: 2,
            p: 2,
          },
        }}
      >
        <TextField
          label="イベントコード"
          variant="outlined"
          value={code ?? event.code}
          onChange={(e) => {
            const value = e.target.value;
            if (value === event.code) {
              setCode(undefined);
            } else {
              setCode(value);
            }
          }}
        />
        <TextField
          label="イベント名"
          variant="outlined"
          value={name ?? event.name}
          onChange={(e) => {
            const value = e.target.value;
            if (value === event.name) {
              setName(undefined);
            } else {
              setName(value);
            }
          }}
        />
        <TextField
          label="日付"
          type="date"
          variant="outlined"
          value={date ?? event.date}
          onChange={(e) => {
            const value = e.target.value;
            if (Date.parse(value) === new Date(event.date).getTime()) {
              setDate(undefined);
            } else {
              setDate(value);
            }
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={
            isMutating || [code, name, date].every((v) => v === undefined)
          }
          onClick={async (e) => {
            e.preventDefault();
            await trigger(body);
            setOpen(false);
            setName(undefined);
            setCode(undefined);
            setDate(undefined);
          }}
        >
          更新
        </Button>
      </Dialog>
    </>
  );
}

function playground(items: ItemSchema[]) {
  return `\
type Itemcode = ${items.map((item) => `"${item.code}"`).join(" | ") || "never"};

interface RecordState {
  count: number;
  dedication?: boolean;
}

type State = {
  [K in Itemcode]?: RecordState;
}

function calculate(state: State): number {
  return 0;
}
`;
}

function UpdateCalculator({ event }: { event: EventSchema }) {
  const { trigger, isMutating } = useUpdateEvent({ eventcode: event.code });
  const [calculator, setCalculator] = useState<string>();

  const hash = useMemo(
    () => compressToEncodedURIComponent(playground(event.items)),
    [event.items]
  );
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          columnGap: "1em",
        }}
      >
        <Typography variant="h3" sx={{ fontSize: "1.5em" }}>
          計算機
        </Typography>
        <Button
          variant="outlined"
          sx={{ textTransform: "none" }}
          href={`https://www.typescriptlang.org/play?#code/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          TS Playground
        </Button>
        <Button
          variant="contained"
          disabled={
            isMutating ||
            calculator === undefined ||
            !isValidCalculator(calculator)
          }
          onClick={async (e) => {
            e.preventDefault();
            if (!calculator || !isValidCalculator(calculator)) return;
            await trigger({ calculator });
            setCalculator(undefined);
          }}
        >
          更新
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: "0",
          alignItems: "flex-start",
        }}
      >
        {"function calculate(state) {"}
        <TextField
          variant="outlined"
          sx={{ m: "1em", width: "100%" }}
          value={calculator ?? event.calculator}
          error={calculator !== undefined && !isValidCalculator(calculator)}
          multiline
          onChange={(e) => {
            const value = e.target.value;
            if (value === event.calculator) {
              setCalculator(undefined);
            } else {
              setCalculator(value);
            }
          }}
        />
        {"}"}
      </Box>
    </>
  );
}

function DisplayArray({ event }: { event: EventSchema }) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Typography variant="h3" sx={{ fontSize: "1.5em" }}>
          お品書き
        </Typography>
        <DisplayDialog event={event} />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "center",
          rowGap: 2,
          columnGap: 2,
          padding: 2,
        }}
      >
        {event.items.map((item) => (
          <Card
            key={item.code}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 2,
            }}
          >
            <CardMedia
              component="img"
              image={item.picture}
              alt={item.name}
              sx={{ maxWidth: 200 }}
            />
            <CardContent sx={{ textAlign: "center", textTransform: "none" }}>
              <Box sx={{ fontSize: "1.5em", fontWeight: "bold" }}>
                {item.name}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}

const useItems = createUseRoute(readItems);
const useCreateDisplay = createUseRouteMutation(createDisplay);
const useDeleteDisplay = createUseRouteMutation(deleteDisplay);

function DisplayDialog({ event }: { event: EventSchema }) {
  const [open, setOpen] = useState(false);
  const { data: items } = useItems();

  return (
    <>
      <Button sx={{ m: "1em" }} onClick={() => setOpen(true)}>
        <Edit />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>お品書きを編集</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          {items?.map((item) => (
            <DisplaySwitch
              key={item.code}
              eventcode={event.code}
              item={item}
              included={event.items.some((i) => i.code === item.code)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DisplaySwitch({
  eventcode,
  item,
  included,
}: {
  eventcode: string;
  item: ItemSchema;
  included: boolean;
}) {
  const { trigger: triggerCreate, isMutating: isCreating } = useCreateDisplay({
    eventcode,
    itemcode: item.code,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteDisplay({
    eventcode,
    itemcode: item.code,
  });
  const { mutate } = useSWRConfig();

  async function onCreate() {
    await triggerCreate(null);
    await mutate(
      `/api/events/${eventcode}`,
      (event) =>
        event && {
          ...event,
          items: [...event.items, item].sort((a, b) =>
            a.code.localeCompare(b.code)
          ),
        },
      false
    );
  }

  async function onDelete() {
    await triggerDelete(null);
    await mutate(
      `/api/events/${eventcode}`,
      (event) =>
        event && {
          ...event,
          items: event.items.filter((i: any) => i.code !== item.code),
        },
      false
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: "1.5em", fontWeight: "bold" }}
      >
        {item.name}
      </Typography>
      <Switch
        sx={{ m: "1em" }}
        checked={included}
        onChange={(e) => {
          if (e.target.checked) {
            onCreate();
          } else {
            onDelete();
          }
        }}
        disabled={isCreating || isDeleting}
      />
    </Box>
  );
}

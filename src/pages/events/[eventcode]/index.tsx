import Layout from "@/components/Layout";
import { prisma } from "@/lib/prisma";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { createDisplay, deleteDisplay } from "@/types/display";
import { readEvent, updateEvent, Event as EventSchema } from "@/types/event";
import { readItems, Item as ItemSchema } from "@/types/item";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import type { Static } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
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
    <Layout
      headTitle={`${title} | Kiradopay`}
      bodyTitle={title}
      containerProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          rowGap: 2,
        },
      }}
    >
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
        {event && <UpdateEvent {...event} />}
      </Box>
      {event && <UpdateCalculator {...event} />}
      {event && <DisplayArray event={event} />}
    </Layout>
  );
}

const useUpdateEvent = createUseRouteMutation(updateEvent);
const updateEventBody = TypeCompiler.Compile(updateEvent.body);

function UpdateEvent(event: Static<typeof EventSchema>) {
  const { trigger, isMutating } = useUpdateEvent({ eventcode: event.code });

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string>();
  const [name, setName] = useState<string>();
  const [date, setDate] = useState<string>();

  const body = { code, name, date };
  const isValid = updateEventBody.Check(body);

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
            isMutating ||
            !isValid ||
            [code, name, date].every((v) => v === undefined)
          }
          onClick={async (e) => {
            e.preventDefault();
            if (!isValid) return;
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

function playground(items: Static<typeof ItemSchema>[]) {
  return `\
type Itemcode = ${items.map((item) => `"${item.code}"`).join(" | ")};

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

function UpdateCalculator(event: Static<typeof EventSchema>) {
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
        }}
      >
        <Typography variant="h3" sx={{ fontSize: "1.5em" }}>
          計算機
        </Typography>
        <Button
          variant="outlined"
          sx={{ m: "1em" }}
          href={`https://www.typescriptlang.org/play?#code/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          TypeScript Playground
        </Button>
        <Button
          variant="contained"
          sx={{ m: "1em" }}
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
        {"function calculate(records) {"}
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

const useItems = createUseRoute(readItems);
const useCreateDisplay = createUseRouteMutation(createDisplay);
const useDeleteDisplay = createUseRouteMutation(deleteDisplay);

function DisplayArray({ event }: { event: Static<typeof EventSchema> }) {
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
        <CreateDisplayDialog event={event} />
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
            <CardActions
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <DeleteDisplayDialog eventcode={event.code} item={item} />
            </CardActions>
          </Card>
        ))}
      </Box>
    </>
  );
}

function CreateDisplayDialog({ event }: { event: Static<typeof EventSchema> }) {
  const [open, setOpen] = useState(false);
  const { data: items } = useItems();

  return (
    <>
      <Button sx={{ m: "1em" }} onClick={() => setOpen(true)}>
        <Add />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>お品書きを追加</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          {items
            ?.filter((item) => !event.items.some((i) => i.code === item.code))
            .map((item) => (
              <CreateDisplay
                key={item.code}
                eventcode={event.code}
                item={item}
                onClose={() => setOpen(false)}
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

function CreateDisplay({
  eventcode,
  item,
  onClose,
}: {
  eventcode: string;
  item: Static<typeof ItemSchema>;
  onClose: () => void;
}) {
  const { trigger, isMutating } = useCreateDisplay({
    eventcode,
    itemcode: item.code,
  });
  const { mutate } = useSWRConfig();

  return (
    <Button
      variant="contained"
      sx={{ m: "1em" }}
      disabled={isMutating}
      onClick={async (e) => {
        const shift = e.shiftKey;
        e.preventDefault();
        await trigger(null);
        await mutate(
          `/api/events/${eventcode}`,
          (event) =>
            event && {
              ...event,
              items: [...event.items, item].sort((a, b) =>
                a.name.localeCompare(b.name)
              ),
            },
          { revalidate: false }
        );
        if (!shift) onClose();
      }}
    >
      {item.name}
    </Button>
  );
}

function DeleteDisplayDialog({
  eventcode,
  item,
}: {
  eventcode: string;
  item: Static<typeof ItemSchema>;
}) {
  const { trigger, isMutating } = useDeleteDisplay({
    eventcode,
    itemcode: item.code,
  });
  const { mutate } = useSWRConfig();

  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <Delete />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>お品書きを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {item.name}をお品書きから削除しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isMutating}
            onClick={async (e) => {
              e.preventDefault();
              await trigger(null);
              await mutate(
                `/api/events/${eventcode}`,
                (event) =>
                  event && {
                    ...event,
                    items: event.items.filter((i: any) => i.code !== item.code),
                  },
                { revalidate: false }
              );
              setOpen(false);
            }}
          >
            削除する
          </Button>
          <Button disabled={isMutating} onClick={() => setOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

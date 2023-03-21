import EventCard from "@/components/EventCard";
import EventDialog from "@/components/EventDialog";
import ItemCard from "@/components/ItemCard";
import Layout from "@/components/Layout";
import { verify } from "@/lib/auth";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import {
  useCreateDisplay,
  useDeleteDisplay,
  useEvent,
  useItems,
  useUpdateEvent,
} from "@/lib/swr";
import { UpdateEvent, Event as EventSchema } from "@/types/event";
import type { Item as ItemSchema } from "@/types/item";
import Edit from "@mui/icons-material/Edit";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { compressToEncodedURIComponent } from "lz-string";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

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
      {event && <About event={event} />}
      {event && <UpdateCalculator event={event} />}
      {event && <Display event={event} />}
    </Layout>
  );
}

function About({ event }: { event: EventSchema }) {
  const { trigger, isMutating } = useUpdateEvent({ eventcode: event.code });
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", columnGap: 2, m: 2 }}>
      <EventCard width={300} event={event} onClick={() => setOpen(true)} />
      <EventDialog
        schema={UpdateEvent}
        title="イベントを更新"
        event={event}
        open={open}
        onClose={() => setOpen(false)}
        isMutating={isMutating}
        buttons={[
          {
            label: "更新",
            needsValidation: true,
            needsUpdate: true,
            onClick: async (body) => {
              await trigger(body);
              setOpen(false);
            },
          },
        ]}
      />
      <Button
        variant="contained"
        onClick={() => router.push(`/${event.code}/register`)}
      >
        レジを起動
      </Button>
      <Button
        variant="contained"
        onClick={() => router.push(`/${event.code}/receipts`)}
      >
        購入履歴
      </Button>
    </Box>
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
  [K in Itemcode]: RecordState;
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
          columnGap: 2,
        }}
      >
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
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
        <LoadingButton
          variant="contained"
          loading={isMutating}
          disabled={calculator === undefined || !isValidCalculator(calculator)}
          onClick={async (e) => {
            e.preventDefault();
            if (!calculator || !isValidCalculator(calculator)) return;
            await trigger({ calculator });
            setCalculator(undefined);
          }}
        >
          更新
        </LoadingButton>
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

function Display({ event }: { event: EventSchema }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          お品書き
        </Typography>
        <IconButton
          color="primary"
          sx={{ m: "1em" }}
          onClick={() => setOpen(true)}
        >
          <Edit />
        </IconButton>
      </Box>
      <Grid container spacing={2} sx={{ mx: 2 }}>
        {event.items.map((item) => (
          <Grid item key={item.code}>
            <ItemCard item={item} width={250} />
          </Grid>
        ))}
      </Grid>
      <DisplayDialog event={event} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DisplayDialog({
  event,
  open,
  onClose,
}: {
  event: EventSchema;
  open: boolean;
  onClose: () => void;
}) {
  const { data: items } = useItems();

  return (
    <Dialog open={open} onClose={onClose}>
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
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
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
  const { mutate } = useEvent({ eventcode });
  const { trigger: triggerCreate, isMutating: isCreating } = useCreateDisplay({
    eventcode,
    itemcode: item.code,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteDisplay({
    eventcode,
    itemcode: item.code,
  });

  async function onCreate() {
    await triggerCreate(null);
    await mutate(
      (event) =>
        event && {
          ...event,
          items: [...event.items, item].sort((a, b) =>
            a.code.localeCompare(b.code)
          ),
        },
      { revalidate: false }
    );
  }

  async function onDelete() {
    await triggerDelete(null);
    await mutate(
      (event) =>
        event && {
          ...event,
          items: event.items.filter((i: any) => i.code !== item.code),
        },
      { revalidate: false }
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
        sx={{ fontSize: "1em", fontWeight: "bold" }}
      >
        {item.name}
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Switch
        checked={included}
        onChange={(e) => {
          if (e.target.checked) onCreate();
          else onDelete();
        }}
        disabled={isCreating || isDeleting}
      />
    </Box>
  );
}

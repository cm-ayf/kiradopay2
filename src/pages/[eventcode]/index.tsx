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
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useAlert } from "@/components/Alert";
import EventCard from "@/components/EventCard";
import EventDialog from "@/components/EventDialog";
import ItemCard from "@/components/ItemCard";
import Layout from "@/components/Layout";
import {
  ConflictError,
  useDeleteEvent,
  useEvent,
  useItems,
  useTitle,
  useUpdateEvent,
} from "@/hooks/swr";
import { Event as EventSchema, UpdateEvent } from "@/types/event";

// export { eventScoped as getServerSideProps } from "@/lib/ssr";

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
  const title = useTitle(eventcode);

  return (
    <Layout title={title} back="/">
      <About eventcode={eventcode} />
      <UpdateCalculator eventcode={eventcode} />
      <Display eventcode={eventcode} />
    </Layout>
  );
}

function About({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateEvent({
    eventcode,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteEvent({
    eventcode,
  });
  const router = useRouter();
  const { error, success } = useAlert();
  const [open, setOpen] = useState(false);

  async function onClickUpdate(body: UpdateEvent) {
    try {
      await triggerUpdate(body);
      success("イベントを更新しました");
      setOpen(false);
      if (body.code) router.replace(`/${body.code}`);
    } catch (e) {
      if (e instanceof ConflictError) error("イベントコードが重複しています");
      else error("イベントの更新に失敗しました");
      throw e;
    }
  }

  async function onClickDelete() {
    try {
      await triggerDelete(null, { revalidate: false });
      router.push("/");
    } catch (e) {
      console.error(e);
      if (e instanceof ConflictError)
        error("このイベントにはすでに購入履歴があります");
      error("イベントの削除に失敗しました");
      throw e;
    }
  }

  if (!event) return null;
  return (
    <>
      <Box sx={{ my: 2, display: "flex", flexDirection: "row", columnGap: 2 }}>
        <EventCard event={event} onClick={() => setOpen(true)} />
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
      <EventDialog
        schema={UpdateEvent}
        title="イベントを更新"
        event={event}
        open={open}
        onClose={() => setOpen(false)}
        isMutating={isUpdating || isDeleting}
        buttons={[
          {
            label: "更新",
            needsValidation: true,
            needsUpdate: true,
            onClick: onClickUpdate,
          },
          { label: "削除", color: "error", onClick: onClickDelete },
        ]}
      />
    </>
  );
}

function playground({ calculator, items }: EventSchema) {
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
${calculator
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")}
}
`;
}

function UpdateCalculator({ eventcode }: { eventcode: string }) {
  const { data: event, isLoading } = useEvent({ eventcode });
  const { trigger, isMutating } = useUpdateEvent({ eventcode });
  const { error, success } = useAlert();
  const [calculator, setCalculator] = useState("");

  useEffect(() => {
    if (isLoading || !event) return;
    setCalculator(event.calculator);
    // for first state rendering; should only be called once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const hash = useMemo(
    () => event && compressToEncodedURIComponent(playground(event)),
    [event]
  );

  async function onClick() {
    try {
      await trigger({ calculator });
      success("計算機を更新しました");
    } catch (e) {
      error("計算機の更新に失敗しました");
      throw e;
    }
  }

  return (
    <>
      <Box sx={{ my: 2, display: "flex", flexDirection: "row", columnGap: 2 }}>
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
          disabled={
            isLoading ||
            calculator === event?.calculator ||
            !isValidCalculator(calculator)
          }
          onClick={onClick}
        >
          更新
        </LoadingButton>
      </Box>
      <Box
        sx={{
          width: "100%",
          m: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {"function calculate(state) {"}
        <TextField
          variant="outlined"
          sx={{ px: 2, width: "100%" }}
          value={calculator}
          error={
            calculator !== event?.calculator && !isValidCalculator(calculator)
          }
          multiline
          onChange={(e) => setCalculator(e.target.value)}
        />
        {"}"}
      </Box>
    </>
  );
}

function Display({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
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
      <Grid container spacing={2}>
        {event?.items.map((item) => (
          <Grid item key={item.code}>
            <ItemCard item={item} />
          </Grid>
        ))}
      </Grid>
      <DisplayDialog
        eventcode={eventcode}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function DisplayDialog({
  eventcode,
  open,
  onClose,
}: {
  eventcode: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: event, isLoading } = useEvent({ eventcode });
  const { data: items } = useItems();
  const { trigger, isMutating } = useUpdateEvent({ eventcode });
  const { error, success } = useAlert();
  const defaultDisplays = event?.items.map((i) => i.code) || [];
  const [displays, setDisplays] = useState(defaultDisplays);

  useEffect(() => {
    if (isLoading || !event) return;
    setDisplays(event.items.map((i) => i.code));
    // for first state rendering; should only be called once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>お品書きを編集</DialogTitle>
      <DialogContent>
        <DialogContentText></DialogContentText>
        {items?.map((item) => (
          <Box key={item.code} sx={{ display: "flex", alignItems: "center" }}>
            <Typography>{item.name}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Switch
              key={item.code}
              checked={displays.some((code) => code === item.code)}
              onChange={(e) => {
                if (e.target.checked) setDisplays([...displays, item.code]);
                else setDisplays(displays.filter((i) => i !== item.code));
              }}
              disabled={isMutating}
            />
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <LoadingButton
          onClick={async () => {
            try {
              await trigger({ items: displays });
              success("お品書きを更新しました");
              onClose();
            } catch (e) {
              if (e instanceof ConflictError)
                error("この商品はすでに購入されています");
              else error("お品書きの更新に失敗しました");
              throw e;
            }
          }}
          loading={isMutating}
          disabled={
            [...displays].sort().toString() ===
            [...defaultDisplays].sort().toString()
          }
        >
          更新
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

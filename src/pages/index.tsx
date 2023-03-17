import Layout from "@/components/Layout";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { createEvent, readEvents } from "@/types/event";
import { createItem, readItems } from "@/types/item";
import { Box, Button, Dialog, TextField, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import { Item } from "@/components/Item";

export async function getServerSideProps() {
  const [events, items] = await prisma.$transaction([
    prisma.event.findMany({
      include: {
        displays: {
          include: { item: true },
        },
      },
    }),
    prisma.item.findMany(),
  ]);

  return {
    props: {
      fallback: {
        "/api/events": events.map(({ displays, ...event }) => ({
          ...event,
          date: event.date.toISOString(),
          displays: displays.map(({ item }) => item),
        })),
        "/api/items": items,
      },
    },
  };
}

const useEvents = createUseRoute(readEvents);
const useItems = createUseRoute(readItems);

export default function Home() {
  const { data: events } = useEvents();
  const { data: items } = useItems();

  return (
    <Layout
      headTitle="Kiradopay - トップ"
      bodyTitle="Kiradopay"
      menuItems={[{ href: "/profile", textContent: "名前の変更" }]}
      containerProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          rowGap: 2,
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          イベント
        </Typography>
        <CreateEvent />
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
        {events?.map((event) => (
          <Button
            key={event.code}
            variant="contained"
            href={`/events/${event.code}`}
            sx={{ fontSize: "1.5em", lineHeight: "normal", py: 1 }}
          >
            {event.name}
          </Button>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          商品
        </Typography>
        <CreateItem />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          alignItems: "center",
          rowGap: 2,
          columnGap: 2,
          padding: 2,
        }}
      >
        {items?.map((item) => (
          <Button
            key={item.code}
            href={`/items/${item.code}`}
            sx={{ fontSize: "1.5em", lineHeight: "normal", py: 1 }}
          >
            <Item {...item} />
          </Button>
        ))}
      </Box>
    </Layout>
  );
}

const useCreateEvent = createUseRouteMutation(createEvent);
const createEventBody = TypeCompiler.Compile(createEvent.body);

function CreateEvent() {
  const { trigger, isMutating } = useCreateEvent();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString());

  const body = { code, name, date: new Date(date) };
  const isValid = createEventBody.Check(body);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        sx={{ fontSize: "1.5em", lineHeight: "normal", py: 1 }}
      >
        <Add />
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
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label="イベント名"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="日付"
          type="date"
          variant="outlined"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isMutating || !isValid}
          onClick={async (e) => {
            e.preventDefault();
            await trigger(body);
            setOpen(false);
          }}
        >
          作成
        </Button>
      </Dialog>
    </>
  );
}

const useCreateItem = createUseRouteMutation(createItem);
const createItemBody = TypeCompiler.Compile(createItem.body);

function CreateItem() {
  const { trigger, isMutating } = useCreateItem();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [picture, setPicture] = useState("");

  const body = { code, name, picture };
  const isValid = createItemBody.Check(body);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        sx={{ fontSize: "1.5em", lineHeight: "normal", py: 1 }}
      >
        <Add />
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
          label="商品コード"
          variant="outlined"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label="商品名"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="画像URL"
          variant="outlined"
          value={picture}
          onChange={(e) => setPicture(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isMutating || !isValid}
          onClick={async (e) => {
            e.preventDefault();
            await trigger(body);
            setOpen(false);
          }}
        >
          作成
        </Button>
      </Dialog>
    </>
  );
}

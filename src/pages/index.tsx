import Layout from "@/components/Layout";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { createEvent, readEvents } from "@/types/event";
import { createItem, readItems } from "@/types/item";
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
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
        }}
      >
        {events?.map((event) => (
          <Link key={event.code} href={`/events/${event.code}`}>
            <Card key={event.code}>
              <CardContent sx={{ textAlign: "center", textTransform: "none" }}>
                <Box sx={{ fontSize: "1.5em", fontWeight: "bold" }}>
                  {event.name}
                </Box>
              </CardContent>
            </Card>
          </Link>
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
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "center",
          rowGap: 2,
          columnGap: 2,
          padding: 2,
        }}
      >
        {items?.map((item) => (
          <Link key={item.code} href={`/items/${item.code}`}>
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
          </Link>
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
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>イベントを作成</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            rowGap: 2,
          }}
        >
          <DialogContentText></DialogContentText>
          <TextField
            label="イベントコード"
            variant="standard"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <TextField
            label="イベント名"
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="日付"
            type="date"
            variant="standard"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={isMutating || !isValid}
            onClick={async (e) => {
              e.preventDefault();
              if (!isValid) return;
              await trigger(body);
              setOpen(false);
            }}
          >
            作成
          </Button>
        </DialogActions>
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
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>商品を作成</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            rowGap: 2,
          }}
        >
          <DialogContentText></DialogContentText>
          <TextField
            label="商品コード"
            variant="standard"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <TextField
            label="商品名"
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="画像URL"
            variant="standard"
            value={picture}
            onChange={(e) => setPicture(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={isMutating || !isValid}
            onClick={async (e) => {
              e.preventDefault();
              if (!isValid) return;
              await trigger(body);
              setOpen(false);
            }}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

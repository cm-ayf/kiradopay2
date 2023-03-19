import Layout from "@/components/Layout";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { createEvent, readEvents } from "@/types/event";
import {
  Item,
  createItem,
  deleteItem,
  readItems,
  updateItem,
} from "@/types/item";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import { useState } from "react";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import { verify } from "@/lib/auth";
import EventCard from "@/components/EventCard";
import EventDialog from "@/components/EventDialog";
import ItemCard from "@/components/ItemCard";
import ItemDialog from "@/components/ItemDialog";

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
  const token = await verify(req);
  if (!token) return { props: {} };

  const [events, items] = await prisma.$transaction([
    prisma.event.findMany({ include: eventInclude }),
    prisma.item.findMany({ orderBy: { code: "asc" } }),
  ]);

  return {
    props: {
      fallback: {
        "/api/users/me": token,
        "/api/events": events.map(toEvent),
        "/api/items": items,
      },
    },
  };
}

export default function Home() {
  return (
    <Layout headTitle="Kiradopay" bodyTitle="Kiradopay">
      <Events />
      <Items />
    </Layout>
  );
}

const useEvents = createUseRoute(readEvents);
const useCreateEvent = createUseRouteMutation(createEvent);

function Events() {
  const { data: events } = useEvents();
  const { trigger, isMutating } = useCreateEvent();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "row", my: 2 }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          イベント
        </Typography>
        <IconButton color="primary" onClick={() => setOpen(true)}>
          <Add />
        </IconButton>
      </Box>
      <Grid container spacing={2} sx={{ mx: 2 }}>
        {events?.map((event) => (
          <Grid item key={event.code}>
            <EventCard
              event={event}
              width={250}
              onClick={() => router.push(`/${event.code}`)}
            />
          </Grid>
        ))}
      </Grid>
      <EventDialog
        schema={createEvent.body}
        title="イベントを作成"
        open={open}
        onClose={() => setOpen(false)}
        isMutating={isMutating}
        buttons={[
          {
            label: "作成",
            needsValidation: true,
            onClick: async (body) => {
              await trigger(body);
              router.push(`/${body.code}`);
            },
          },
        ]}
      />
    </>
  );
}

const useItems = createUseRoute(readItems);
const useCreateItem = createUseRouteMutation(createItem);

function Items() {
  const { data: items } = useItems();
  const [open, setOpen] = useState(false);
  const { trigger, isMutating } = useCreateItem();

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "row", my: 2 }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          商品
        </Typography>
        <IconButton color="primary" onClick={() => setOpen(true)}>
          <Add />
        </IconButton>
      </Box>
      <Grid container spacing={2} sx={{ mx: 2 }}>
        {items?.map((item) => (
          <Grid item key={item.code}>
            <ItemWrapper key={item.code} item={item} />
          </Grid>
        ))}
      </Grid>
      <ItemDialog
        schema={createItem.body}
        title="商品を作成"
        open={open}
        onClose={() => setOpen(false)}
        isMutating={isMutating}
        buttons={[
          {
            label: "作成",
            needsValidation: true,
            onClick: async (body) => {
              await trigger(body);
              setOpen(false);
            },
          },
        ]}
      />
    </>
  );
}

const useUpdateItem = createUseRouteMutation(updateItem);
const useDeleteItem = createUseRouteMutation(deleteItem);

function ItemWrapper({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateItem({
    itemcode: item.code,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteItem({
    itemcode: item.code,
  });

  return (
    <>
      <ItemCard item={item} width={250} onClick={() => setOpen(true)} />
      <ItemDialog
        schema={updateItem.body}
        title="商品を編集"
        item={item}
        open={open}
        onClose={() => setOpen(false)}
        isMutating={isUpdating || isDeleting}
        buttons={[
          {
            label: "更新",
            needsValidation: true,
            needsUpdate: true,
            onClick: async (body) => {
              await triggerUpdate(body);
              setOpen(false);
            },
          },
          {
            label: "削除",
            onClick: async () => {
              await triggerDelete(null);
              setOpen(false);
            },
          },
        ]}
      />
    </>
  );
}

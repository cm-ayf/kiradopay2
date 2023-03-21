import Layout from "@/components/Layout";
import { CreateEvent } from "@/types/event";
import { Item, CreateItem, UpdateItem } from "@/types/item";
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
import {
  useCreateEvent,
  useCreateItem,
  useDeleteItem,
  useEvents,
  useItems,
  useUpdateItem,
} from "@/lib/swr";

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
  const token = verify(req);
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
              onClick={() => router.push(`/${event.code}`)}
            />
          </Grid>
        ))}
      </Grid>
      <EventDialog
        schema={CreateEvent}
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

function Items() {
  const { data: items } = useItems();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<Item>();
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
            <ItemCard
              key={item.code}
              item={item}
              onClick={() => setItem(item)}
            />
          </Grid>
        ))}
      </Grid>
      <CreateItemDialog open={open} onClose={() => setOpen(false)} />
      <MutateItemDialog item={item} onClose={() => setItem(undefined)} />
    </>
  );
}

function CreateItemDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { trigger, isMutating } = useCreateItem();

  return (
    <ItemDialog
      schema={CreateItem}
      title="商品を作成"
      open={open}
      onClose={onClose}
      isMutating={isMutating}
      buttons={[
        {
          label: "作成",
          needsValidation: true,
          onClick: async (body) => {
            await trigger(body);
            onClose();
          },
        },
      ]}
    />
  );
}

function MutateItemDialog({
  item,
  onClose,
}: {
  item: Item | undefined;
  onClose: () => void;
}) {
  const itemcode = item ? item.code : "";
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateItem({
    itemcode,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteItem({
    itemcode,
  });

  return (
    <ItemDialog
      schema={UpdateItem}
      title="商品を編集"
      item={item}
      open={Boolean(item)}
      onClose={onClose}
      isMutating={isUpdating || isDeleting}
      buttons={[
        {
          label: "更新",
          needsValidation: true,
          needsUpdate: true,
          onClick: async (body) => {
            await triggerUpdate(body);
            onClose();
          },
        },
        {
          label: "削除",
          onClick: async () => {
            await triggerDelete(null);
            onClose();
          },
        },
      ]}
    />
  );
}

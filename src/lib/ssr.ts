import type { GetServerSidePropsContext } from "next";
import { verify } from "./auth";
import { eventInclude, prisma, toEvent } from "./prisma";

export async function eventScoped({
  req,
  params,
}: GetServerSidePropsContext<{ eventcode: string }>) {
  const token = verify(req, ["read"]);
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

export async function root({ req }: GetServerSidePropsContext) {
  const token = verify(req, ["read"]);
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

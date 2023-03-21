import type { Event } from "@/types/event";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import type { MouseEventHandler } from "react";

export default function EventCard({
  event,
  onClick,
}: {
  event: Event;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ m: 0, p: 0 }}>
          <Inner event={event} />
        </CardActionArea>
      ) : (
        <Inner event={event} />
      )}
    </Card>
  );
}

function Inner({ event }: { event: Event }) {
  return (
    <>
      <CardContent sx={{ textAlign: "center", textTransform: "none" }}>
        <Box sx={{ fontSize: "1.5em", fontWeight: "bold" }}>{event.name}</Box>
        <Box sx={{ fontSize: "1em" }}>
          {new Date(event.date).toLocaleDateString("ja-JP")}
        </Box>
      </CardContent>
    </>
  );
}

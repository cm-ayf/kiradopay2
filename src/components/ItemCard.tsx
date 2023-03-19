import type { Item } from "@/types/item";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import type { MouseEventHandler } from "react";

export default function ItemCard({
  item,
  width,
  onClick,
}: {
  item: Item;
  width: number;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card sx={{ width }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ m: 0, p: 0 }}>
          <Inner item={item} />
        </CardActionArea>
      ) : (
        <Inner item={item} />
      )}
    </Card>
  );
}

function Inner({ item }: { item: Item }) {
  return (
    <>
      <CardMedia
        component="img"
        image={item.picture}
        alt={item.name}
        sx={{ maxWidth: 200, mx: "auto", my: 2 }}
      />
      <CardContent
        sx={{
          textAlign: "center",
          fontSize: "1.25rem",
          fontWeight: "bold",
          textTransform: "none",
        }}
      >
        {item.name}
      </CardContent>
    </>
  );
}

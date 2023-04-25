import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import type { MouseEventHandler } from "react";
import type { Item } from "@/types/item";

export default function ItemCard({
  item,
  onClick,
}: {
  item: Item;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card>
      {onClick ? (
        <CardActionArea onClick={onClick}>
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
        sx={{ width: 200, m: 2 }}
      />
      <CardContent
        sx={{
          pt: 0,
          pb: 3,
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

import type { Static } from "@sinclair/typebox";
import type { Item as ItemSchema } from "@/types/item";
import { Card, CardMedia } from "@mui/material";

export function Item({ name, picture }: Static<typeof ItemSchema>) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        rowGap: 2,
        columnGap: 2,
        padding: 2,
      }}
    >
      <CardMedia
        component="img"
        image={picture}
        alt={name}
        sx={{ maxWidth: 200 }}
      />
      {name}
    </Card>
  );
}

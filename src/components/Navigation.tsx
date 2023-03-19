import { useRef, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Menu,
  Toolbar,
  Typography,
} from "@mui/material";
import { createUseRoute } from "@/lib/swr";
import { readUsersMe } from "@/types/user";

const useUser = createUseRoute(readUsersMe);

export default function Navigation({ title }: { title: string }) {
  const { data: user, isLoading } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <AppBar position="static" ref={ref}>
      <Toolbar variant="dense">
        <Typography component="h1">{title}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          color="inherit"
          {...(user
            ? { onClick: () => setOpen(true) }
            : { href: "/api/auth/signin" })}
          endIcon={
            isLoading ? (
              <CircularProgress />
            ) : (
              user && <Avatar src={user.picture} alt={user.name} />
            )
          }
        >
          {user?.name ?? "サインイン"}
        </Button>
        <Menu
          anchorEl={ref.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Button href="/api/auth/signout">サインアウト</Button>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

import { useRef, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { createUseRoute, UnauthorizedError } from "@/lib/swr";
import { readUsersMe, User } from "@/types/user";
import { useRouter } from "next/router";
import { CloudOff } from "@mui/icons-material";

const useUser = createUseRoute(readUsersMe, {
  refreshInterval: 1000,
});

type ConnectionState =
  | {
      variant: "connecting";
    }
  | {
      variant: "authorized";
      user: User;
    };

export default function Navigation({ title }: { title: string }) {
  const { data: user, error } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unauthorized = error instanceof UnauthorizedError;

  return (
    <AppBar position="static" ref={ref}>
      <Toolbar variant="dense">
        <Typography component="h1">{title}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          color="inherit"
          onClick={() =>
            error
              ? unauthorized && router.push("/api/auth/signin")
              : user && setOpen(true)
          }
          endIcon={
            error ? (
              !unauthorized && <CloudOff />
            ) : user ? (
              <Avatar src={user.picture} />
            ) : (
              <CircularProgress />
            )
          }
        >
          {error
            ? unauthorized
              ? "サインイン"
              : "接続されていません"
            : user && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textTransform: "none",
                  }}
                >
                  <Typography variant="body2">{user.name}</Typography>
                  <Typography variant="caption">{user.email}</Typography>
                </Box>
              )}
        </Button>
        <Menu
          anchorEl={ref.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => router.push("/api/auth/signout")}>
            サインアウト
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

import { useRef, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { createUseRoute, UnauthorizedError } from "@/lib/swr";
import { readUsersMe } from "@/types/user";
import { useRouter } from "next/router";
import { ArrowBack, CloudOff } from "@mui/icons-material";

const useUser = createUseRoute(readUsersMe, {
  refreshInterval: 1000,
});

export interface NavigationProps {
  bodyTitle: string;
  back?: string;
}

export default function Navigation({ bodyTitle, back }: NavigationProps) {
  const { data: user, error } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unauthorized = error instanceof UnauthorizedError;

  return (
    <AppBar position="static" ref={ref}>
      <Toolbar variant="dense">
        {back && (
          <IconButton color="inherit" onClick={() => router.push(back)}>
            <ArrowBack />
          </IconButton>
        )}
        <Typography component="h1">{bodyTitle}</Typography>
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

import ArrowBack from "@mui/icons-material/ArrowBack";
import CloudOff from "@mui/icons-material/CloudOff";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserState } from "@/hooks/UserState";
import type { Token } from "@/types/user";

export interface NavigationProps {
  title?: string;
  back?: string;
}

export default function Navigation({ title, back }: NavigationProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (title) document.title = title + " | Kiradopay";
  }, [title]);

  return (
    <AppBar position="static" ref={ref}>
      <Toolbar variant="dense">
        {back && (
          <IconButton color="inherit" onClick={() => router.push(back)}>
            <ArrowBack />
          </IconButton>
        )}
        <Typography component="h1">{title ?? "Kiradopay"}</Typography>
        <Box sx={{ flex: 1 }} />
        <MenuButton onClick={() => setOpen(true)} />
        <Menu
          anchorEl={ref.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => (location.pathname = "/api/auth/signout")}>
            サインアウト
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

function MenuButton({ onClick }: { onClick: () => void }) {
  const state = useUserState();

  switch (state.type) {
    case "authorized":
      return <UserButton user={state.user} onClick={onClick} />;
    case "refreshing":
      return state.user ? (
        <UserButton user={state.user} onClick={onClick} />
      ) : (
        <LoadingButton />
      );
    case "unauthorized":
      return <SigninButton />;
    case "error":
      return <NoConnectionButton />;
    case "loading":
      return <LoadingButton />;
  }
}

function UserButton({ user, onClick }: { user: Token; onClick: () => void }) {
  return (
    <Button
      color="inherit"
      onClick={onClick}
      endIcon={<UserAvatar user={user} />}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textTransform: "none",
        }}
      >
        {user.nick ? (
          <>
            <Typography variant="body2" component="span">
              {user.nick}
            </Typography>
            <Typography variant="caption" component="span">
              {user.username}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" component="span">
            {user.username}
          </Typography>
        )}
      </Box>
    </Button>
  );
}

function UserAvatar({ user }: { user: Token }) {
  if (!user.avatar) return <Avatar />;

  const url = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`;
  return <Avatar src={url} />;
}

function SigninButton() {
  return (
    <Button
      color="inherit"
      onClick={() => (location.pathname = "/api/auth/signin")}
    >
      サインイン
    </Button>
  );
}

function NoConnectionButton() {
  return (
    <Button color="inherit" disabled endIcon={<CloudOff />}>
      接続されていません
    </Button>
  );
}

function LoadingButton() {
  return <Button color="inherit" disabled endIcon={<CircularProgress />} />;
}

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import { type PropsWithChildren } from "react";
import Navigation, { NavigationProps } from "./Navigation";
import { useScopes } from "@/hooks/UserState";
import { Scope } from "@/types/user";

export interface LayoutProps extends NavigationProps {
  scopes: Scope[];
  top?: React.ReactNode;
  bottom?: React.ReactNode;
}

export default function Layout({
  children,
  scopes,
  top,
  bottom,
  ...navigation
}: PropsWithChildren<LayoutProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Navigation {...navigation} />
      {top && <Box flex={0}>{top}</Box>}
      <Container
        sx={{
          flex: "auto",
          overflowX: "hidden",
          overflowY: "scroll",
          py: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Scopes scopes={scopes}>{children}</Scopes>
      </Container>
      {bottom && <Box flex={0}>{bottom}</Box>}
    </Box>
  );
}

function Scopes({
  children,
  scopes: scopesRequired,
}: PropsWithChildren<{ scopes: Scope[] }>) {
  const scopes = useScopes();
  if (!scopes) return <CircularProgress />;
  const authorized = scopesRequired.every((scope) => scopes[scope]);
  if (authorized) return <>{children}</>;
  else return "このページを表示する権限がありません。";
}

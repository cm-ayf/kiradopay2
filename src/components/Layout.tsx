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
      {top && (
        <Scopes scopes={scopes}>
          <Box flex={0}>{top}</Box>
        </Scopes>
      )}
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
        <Scopes
          scopes={scopes}
          fallback="このページを表示する権限がありません。"
        >
          {children}
        </Scopes>
      </Container>
      {bottom && (
        <Scopes scopes={scopes}>
          <Box flex={0}>{bottom}</Box>
        </Scopes>
      )}
    </Box>
  );
}

function Scopes({
  children,
  scopes: scopesRequired,
  fallback,
}: PropsWithChildren<{
  scopes: Scope[];
  fallback?: React.ReactNode;
}>) {
  const scopes = useScopes();
  if (!scopes) return <CircularProgress />;
  const authorized = scopesRequired.every((scope) => scopes[scope]);
  if (authorized) return <>{children}</>;
  else return <>{fallback}</>;
}

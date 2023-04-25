import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Head from "next/head";
import type { PropsWithChildren } from "react";
import Navigation, { NavigationProps } from "./Navigation";

export interface LayoutProps extends NavigationProps {
  bottom?: React.ReactNode;
}

export default function Layout({
  children,
  bottom,
  ...navigation
}: PropsWithChildren<LayoutProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Head>
        <title>
          {navigation.title ? `${navigation.title} | Kiradopay` : "Kiradopay"}
        </title>
      </Head>
      <Navigation {...navigation} />
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
        {children}
      </Container>
      {bottom && <Box flex={0}>{bottom}</Box>}
    </Box>
  );
}

import Head from "next/head";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Navigation, { NavigationProps } from "./Navigation";
import type { PropsWithChildren } from "react";

export interface LayoutProps extends NavigationProps {
  headTitle: string;
  bottom?: React.ReactNode;
}

export default function Layout({
  children,
  headTitle,
  bottom,
  ...navigation
}: PropsWithChildren<LayoutProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Head>
        <title>{headTitle}</title>
      </Head>
      <Navigation {...navigation} />
      <Container
        sx={{ flex: "auto", overflowX: "hidden", overflowY: "scroll", py: 2 }}
      >
        {children}
      </Container>
      {bottom && <Box flex={0}>{bottom}</Box>}
    </Box>
  );
}

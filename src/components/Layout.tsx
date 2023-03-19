import Head from "next/head";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Navigation, { NavigationProps } from "./Navigation";
import type { PropsWithChildren } from "react";

type LayoutProps = PropsWithChildren<
  NavigationProps & {
    headTitle: string;
    bottom?: React.ReactNode;
  }
>;

const Layout: React.FC<LayoutProps> = ({
  children,
  bottom,
  headTitle,
  ...navigation
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <Head>
      <title>{headTitle}</title>
    </Head>
    <Navigation {...navigation} />
    <Container sx={{ flex: "auto", overflowY: "auto", py: 2 }}>
      {children}
    </Container>
    {bottom}
  </Box>
);

export default Layout;

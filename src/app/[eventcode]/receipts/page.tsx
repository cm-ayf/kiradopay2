"use client";

import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState } from "react";
import Export from "./Export";
import Summary from "./Summary";
import Table from "./Table";
import Layout from "@/components/Layout";
import { DBStateProvider } from "@/hooks/DBState";
import { useTitle } from "@/hooks/swr";

export const dynamic = "force-static";

export default function Receipts({
  params: { eventcode },
}: {
  params: { eventcode: string };
}) {
  const title = useTitle(eventcode);
  const [tab, setTab] = useState("summary");

  return (
    <DBStateProvider>
      <Layout title={title} back={`/${eventcode}`} docs="receipts">
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="概要" value="summary" />
          <Tab label="表" value="table" />
          <Tab label="出力" value="export" />
        </Tabs>
        <TabContext value={tab}>
          <TabPanel value="summary">
            <Summary eventcode={eventcode} />
          </TabPanel>
          <TabPanel value="table" sx={{ flex: 1 }}>
            <Table eventcode={eventcode} />
          </TabPanel>
          <TabPanel value="export">
            <Export eventcode={eventcode} />
          </TabPanel>
        </TabContext>
      </Layout>
    </DBStateProvider>
  );
}

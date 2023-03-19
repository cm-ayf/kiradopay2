import { AlertProvider } from "@/components/Alert";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { SWRConfig } from "swr";

export default function App({ Component, pageProps }: AppProps) {
  const { fallback = {}, ...props } = pageProps;

  return (
    <SWRConfig value={{ fallback }}>
      <AlertProvider>
        <Component {...props} />
      </AlertProvider>
    </SWRConfig>
  );
}

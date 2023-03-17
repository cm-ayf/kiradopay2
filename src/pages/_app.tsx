import "@/styles/globals.css";
import type { accounts } from "google-one-tap";
import type { AppProps } from "next/app";
import Script from "next/script";
import { SWRConfig } from "swr";

declare const google: {
  accounts: accounts;
};

const clientId = process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"]!;
if (!clientId) {
  throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
}
const host = process.env["NEXT_PUBLIC_HOST"]!;
if (!host) {
  throw new Error("Missing NEXT_PUBLIC_HOST");
}

export default function App({ Component, pageProps }: AppProps) {
  const { fallback = {}, ...props } = pageProps;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" async defer />
      <div
        id="g_id_onload"
        data-client_id={clientId}
        data-context="signin"
        data-login_uri={`${host}/api/login`}
        data-itp_support="true"
      />
      <SWRConfig value={{ fallback }}>
        <Component {...props} />
      </SWRConfig>
    </>
  );
}

import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  override render() {
    return (
      <Html>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1976d2" />
          <link
            rel="apple-touch-icon"
            type="image/png"
            href="/apple-touch-icon-180x180.png"
          />
          <link rel="icon" type="image/png" href="/icon-192x192.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  override render() {
    return (
      <Html>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1976d2" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

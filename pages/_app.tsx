import "../global.css";
import { ThemeProvider } from "next-themes";
import { NextSeo } from "next-seo";

export const name = "Speak Easy";
export const domain = "https://speak-easy-nu.vercel.app";

export default function App({ Component, pageProps }: any) {
  return (
    <>
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
      />
      <NextSeo
        title={name}
        openGraph={{
          type: "website",
          locale: "en_IE",
          url: domain,
          site_name: name,
          title: name,
          description: "Peer to Peer chat",
          images: [
            {
              url: `${domain}/open-graph.png`,
              height: 630,
              width: 1200,
              alt: domain,
            },
          ],
        }}
      />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

import "../global.css";
import { ThemeProvider } from "next-themes";

export default function App({ Component, pageProps }: any) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

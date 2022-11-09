import { ThemeProvider } from "next-themes";
import "../global.css";

const App = ({ Component, pageProps }: any) => {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;

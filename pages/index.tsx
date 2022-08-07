import Head from "next/head";
import { Connection } from "../features/connection";

export default function Index(){
  return (
    <div>
      <Head>
        <title>Speak Easy</title>
        <meta
          name="description"
          content="A peer to peer chat that is e2e encrypted"
        />
      </Head>
      <main>
        <Connection />
      </main>
    </div>
  );
};

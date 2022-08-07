import React from "react";
import { ConnectionView } from "../features/connection/connection-view";

const g = () => {
  const n = Math.floor((1 + Math.random()) * 0x10000);
  return n.toString(16).substring(1);
};
const v4 = () => `${g() + g()}-${g()}-${g()}-${g()}-${g() + g() + g()}`;

export default function Index() {
  return (
    <>
      <main>
        <span>{v4()}</span>
        <ConnectionView />
      </main>
    </>
  );
}

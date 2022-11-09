import React from "react";
import { ConnectionView, Nav } from "../features/connection/connection-view";

export default function Index() {
  return (
    <>
      <main>
          <Nav />
          <ConnectionView />
      </main>
    </>
  );
}

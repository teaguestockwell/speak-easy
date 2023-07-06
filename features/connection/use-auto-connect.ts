import React from "react";
import { useRouter } from "next/router";
import { connectionStore } from "./connection-store";

export const useAutoConnect = () => {
  const router = useRouter();
  React.useEffect(() => {
    if (router.isReady && router.query) {
      const { peer } = router.query;
      if (peer && typeof peer === "string") {
        connectionStore.lpc.autoConnectToPeer(peer);
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(
          { ...window.history.state, as: newUrl, url: newUrl },
          "",
          newUrl
        );
      }
    }
  }, [router.isReady, router.query]);
};

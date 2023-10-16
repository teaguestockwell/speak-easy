import React from "react";
import { useRouter } from "next/router";
import { connectionStore, constants } from "./connection-store";

export const useAutoConnect = () => {
  const router = useRouter();
  React.useEffect(() => {
    if (router.isReady) {
      if (router.query) {
        const { peer } = router.query;
        if (peer && typeof peer === "string") {
          connectionStore.lpc.autoConnectToPeer(peer);
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState(
            { ...window.history.state, as: newUrl, url: newUrl },
            "",
            newUrl
          );
        } else if (localStorage.getItem(constants.skipSelfIdSelectKey)) {
          connectionStore.lpc.publishToBroker(undefined);
        } else {
          localStorage.setItem(constants.skipSelfIdSelectKey, "1");
        }
      }
    }
  }, [router.isReady, router.query]);
};

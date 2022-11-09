import React from "react";

type FlexDir = "row" | "column";

const getMainAxis = (): FlexDir => {
  const { innerWidth, innerHeight } = window;
  return innerWidth > innerHeight ? "row" : "column";
};

export const useMainAxisFlexDir = () => {
  const [state, setState] = React.useState<FlexDir>(getMainAxis);
  React.useEffect(() => {
    const interval = setInterval(() => setState(getMainAxis()), 500);
    return () => {
      clearInterval(interval);
    };
  }, []);
  return state;
};

export type WithMainAxisFlexDir = {
  children: (flexDir: FlexDir) => JSX.Element;
};

export const WithMainAxisFlexDir = (props: WithMainAxisFlexDir) => {
  const flexDir = useMainAxisFlexDir();
  return props.children(flexDir);
};

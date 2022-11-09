import { BottomNav } from "./bottom-nav";
import { Content } from "./content";
import { Loader } from "./loader";
import { TopNav } from "./top-nav";

export const Connection = () => {
  return (
    <>
      <TopNav />
      <Content />
      <BottomNav />
      <Loader />
    </>
  );
};

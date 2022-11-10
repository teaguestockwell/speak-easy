import { BottomNav } from "./bottom-nav";
import { Content } from "./content";
import { Loader } from "./loader";
import { TopNav } from "./top-nav";
import cn from "./index.module.css";
import { useAutoConnect } from "./use-auto-connect";

export const Connection = () => {
  useAutoConnect();
  return (
    <div className={cn.root}>
      <TopNav />
      <Content />
      <BottomNav />
      <Loader />
    </div>
  );
};

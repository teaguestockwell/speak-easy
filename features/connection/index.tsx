import { BottomNav } from "./bottom-nav";
import { Content } from "./content";
import { Loader } from "./loader";
import { TopNav } from "./top-nav";
import cn from "./index.module.css";

export const Connection = () => {
  return (
    <div className={cn.root}>
      <TopNav />
      <Content />
      <BottomNav />
      <Loader />
    </div>
  );
};

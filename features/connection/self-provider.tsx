import cn from "./self-provider.module.css";
import { connectionStore, connectionActions } from "./connection-store";

export type SelfProviderProps = React.PropsWithChildren<{}>;

export const SelfProvider = (props: SelfProviderProps) => {
  const selfId = connectionStore((s) => s.selfId);
  const status = connectionStore(
    (s) => s.status,
    (prev, next) => (next === "connecting-self" ? prev === next : true)
  );

  if (status === "enter-self-id") {
    return (
      <div className={cn.root}>
        <label>enter your id</label>
        <input value={selfId} onChange={connectionActions.setSelfId} />
        <button onClick={connectionActions.initSelf}>done</button>
      </div>
    );
  }

  if (!self) {
    return <div>loading...</div>;
  }

  return <>{props.children}</>;
};

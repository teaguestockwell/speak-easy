import cn from './self-provider.module.css';
import { useConnection, connectionActions, ConnectionState} from "./connection-store";

const selectSelfId = (s: ConnectionState) => s.selfId;
const selectStatus = (s: ConnectionState) => s.status;
const isStatusSelf = (next: ConnectionState['status'], prev: ConnectionState['status']) => {
  if (next === 'connecting-self') {
    return prev === next
  }
  return true
}

export const SelfProvider = (props: React.PropsWithChildren<{}>) => {
  const selfId = useConnection(selectSelfId);
  const status = useConnection(selectStatus, isStatusSelf);

  if (status === 'enter-self-id') {
    return (
      <div className={cn.root}>
        <label>enter your id</label>
        <input value={selfId} onChange={connectionActions.setSelfId} />
        <button onClick={connectionActions.initSelf}>
          done
        </button>
      </div>
    );
  }

  if (!self) {
    return <div>loading...</div>;
  }

  return <>{props.children}</>
};
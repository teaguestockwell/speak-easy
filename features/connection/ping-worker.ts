export type WorkerEvent = {
  rpc: "ping";
  now: number;
};

setInterval(() => {
  const e: WorkerEvent = { rpc: "ping", now: Date.now() };
  postMessage(e);
}, 9000);

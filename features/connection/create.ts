const s = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};

export const guid = () => s() + s() + s() + s() + s() + s() + s() + s();

type Message = {
  reqId: string;
  resId: string;
  fromClientId: string;
  method: string;
  sentEpoch: number;
  receivedEpoch: number;
  resTime: number;
  data?: any;
};

export const create = <
  Rpcs extends {
    [rpc: string]: (arg: any) => Promise<object>;
  },
  State extends object,
  Lpcs extends {
    [name: string]: (arg: any) => any;
  },
  Api = {
    /**
     * call remote procedure with retry until acknowledgement
     */
    rpc: {
      [Rpc in keyof Rpcs]: (
        data: Parameters<Rpcs[Rpc]>[0]
      ) => ReturnType<Rpcs[Rpc]>;
    };
    /**
     * call local procedure
     */
    lpc: {
      [Lpc in keyof Lpcs]: (
        data: Parameters<Lpcs[Lpc]>[0]
      ) => ReturnType<Lpcs[Lpc]>;
    };
    /*
     * set local state and notify local observers
     */
    set: (next: Partial<State> | ((prev: State) => Partial<State>)) => void;
    /**
     * get local state
     */
    get: () => State;
    /**
     * sub to the local store state
     */
    sub: (cb: (s: State) => void) => void;
    pipe: {
      receive: (e: any) => Promise<any>;
      send: (e: any) => void;
    };
  }
>(
  /**
   * produce a client for local and remove pub sub
   */
  produce: (
    api: Api
  ) => {
    /**
     * handlers for each remote procedure subscription
     */
    rpcs: {
      [K in keyof Rpcs]: (
        data: Parameters<Rpcs[K]>[0],
        meta: Message
      ) => ReturnType<Rpcs[K]>;
    };
    /**
     * initial local state
     */
    state?: State;
    /**
     * handlers for each local procedure
     */
    lpcs?: Lpcs;
  },
  options?: {
    clientId: string;
  }
) => {
  let state: any;
  const subs = new Set<any>();
  const clientId = options?.clientId ?? guid();
  const inFlightRequest: { [id: string]: (e: any) => void } = {};
  let res: ReturnType<typeof produce> | undefined;
  const api: any = {
    rpc: {},
    lpc: {},
    set: (exp: any) => {
      state = {
        ...state,
        ...(typeof exp === 'function' ? exp(state) : exp),
      };
      subs.forEach(s => s(state));
    },
    get: () => state,
    sub: (cb: any) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    pipe: {
      send: null,
      receive: async (e: Message) => {
        if (!e.reqId) {
          throw 'cant handle unknown messages';
        }
        if (e.resId) {
          const resolver = inFlightRequest[e.reqId];
          if (!resolver) return;
          resolver(e.data);
          delete inFlightRequest[e.reqId];
          return;
        }
        if (e.reqId) {
          const handler = res?.rpcs?.[e.method];
          if (!handler) throw 'no handler for ' + e.method;
          const { data: d, ...meta } = e;
          const data = await handler(d, meta);
          const message = {
            ...meta,
            resId: guid(),
            data,
          };
          api.pipe.send(message);
          return;
        }
      },
    },
  };

  res = produce(api);
  state = res.state ?? ({} as State);
  Object.entries(res.lpcs ?? {}).forEach(([method, fn]) => {
    api.lpc[method] = fn;
  });
  Object.entries(res.rpcs).forEach(([method]) => {
    api.rpc[method] = (data: any) => {
      if (!api.pipe.send) {
        throw 'must set api.pipe.send before rpcs can be used';
      }
      const reqId = guid();
      const message: Message = {
        reqId,
        resId: '',
        fromClientId: clientId,
        method,
        sentEpoch: performance.now(),
        receivedEpoch: 0,
        resTime: 0,
        data,
      };
      api.pipe.send(message);
      return new Promise(resolve => {
        inFlightRequest[reqId] = resolve;
      });
    };
  });

  return api as Api;
};

export type EchoHandler<C = any, E extends any[] = any[]> = (this: C, ...args: E) => void;

export type EchoListener = {
  handlers: EchoHandler[];
};

export type EchoEvents = Record<string, EchoHandler>;
export type GenericEchoEvents<E extends EchoEvents = EchoEvents> = {
  [K in keyof E]: E[K] | E[K][];
};
export type NormalizedEchoEvents = Record<string, EchoHandler[]>;

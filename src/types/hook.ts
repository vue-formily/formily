import { Override, Simplify, WithDefaults } from './generic';

// export type HookName<N extends string, NS extends string = string> = N | `${N}:${NS}`;
export type HookName<N extends string> = N;

export type HookPayloadDefaults = {
  value?: unknown;
  context?: unknown;
  params?: Record<string, any>;
  meta?: Record<string, any>;
};

export type HookPayload<
  P extends {
    value?: unknown;
    context?: unknown;
    params?: Record<string, any>;
    meta?: Record<string, any>;
  } = HookPayloadDefaults
> = WithDefaults<P, HookPayloadDefaults>;

export type HookHandler<P extends HookPayload = HookPayload> = (payload: P) => P;

export type HookHandlers = Record<string, HookHandler<any>>;

export type ExtendHandler<Base extends HookHandler, Extra extends HookPayload> =
  Base extends HookHandler<infer P> ? HookHandler<Simplify<P & Extra>> : never;

// Override toàn bộ `handlers` trong hook
export type ExtendHandlers<
  BaseHandlers extends HookHandlers,
  ExtraHandlers extends {
    [K in keyof ExtraHandlers]: HookHandler<any>;
  }
> = {
  [K in keyof BaseHandlers]: K extends keyof ExtraHandlers
    ? ExtendHandler<BaseHandlers[K], ExtraHandlers[K] extends HookHandler<infer E> ? E : Record<string, any>>
    : BaseHandlers[K];
} & {
  [K in Exclude<keyof ExtraHandlers, keyof BaseHandlers>]: ExtraHandlers[K];
};

export type ExtendHook<Base extends Hook<any, any>, Extra extends Hook<any, any>> =
  Base extends Hook<infer N, infer P>
    ? Hook<N, Override<P, { handlers: ExtendHandlers<P['handlers'], Extra['handlers']> }>>
    : never;

export type HookDefaults = {
  handlers: HookHandlers;
  scope?: string;
};

export type Hook<
  N extends string = string,
  P extends {
    handlers: HookHandlers;
    scope?: string;
  } = HookDefaults
> = WithDefaults<
  P,
  HookDefaults & {
    name: HookName<N>;
  }
>;

export type HookToPayloads<H extends Hook> = {
  [K in keyof H['handlers'] & string as `${H['name']}.${K}`]: Parameters<H['handlers'][K]>[0];
};

export type AttachHookParam = Hook | Hook[];

export type HookMgrOptions = {
  hooks?: Hook[];
  context?: unknown;
};

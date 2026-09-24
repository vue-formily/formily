import { EchoEvents, EchoHandler, EchoListener, KnownKeys } from '@/types';
import { addItem, removeItems, uid } from '../utils';

function normalizeHandler(handler: EchoHandler | EchoHandler[]): EchoHandler[] {
  return Array.isArray(handler) ? handler : [handler];
}

function emit(echo: Echo, type: string, ...args: any[]) {
  const event = echo.listeners[type];

  if (event) {
    const handlers = event.handlers;

    handlers.forEach(h => h.call(echo, ...args));
  }
}

function off(echo: Echo, type: string, handler?: EchoHandler | EchoHandler[]) {
  const event = echo.listeners[type];

  if (event) {
    const { handlers } = event;

    if (handler) {
      removeItems(handlers, normalizeHandler(handler));
    } else {
      delete echo.listeners[type];
    }
  }
}

function handleEventListeners(this: Echo, type: string, fn: any) {
  Object.keys(this.listeners).forEach((key: string) => {
    const [eventType] = parseType(key);

    if (eventType === type) {
      fn(key);
    }
  });
}

function parseType(type: string) {
  return type.split(':');
}

export class Echo<E extends EchoEvents = Record<string, any>> {
  uid = uid();

  listeners = {} as Record<string, EchoListener>;

  emit<EV extends EchoEvents = E, N extends KnownKeys<EV> & keyof EV = KnownKeys<EV> & keyof EV>(
    type: N,
    ...args: any[]
  ): this;
  emit(type: string, ...args: any[]): this;
  emit(type: string, ...args: any[]): this {
    const [eventType, namespace] = parseType(type);

    if (namespace) {
      emit(this, type, ...args);
    } else {
      handleEventListeners.call(this, eventType, (n: string) => emit(this, n, ...args));
    }

    return this;
  }

  once<EV extends EchoEvents = E, N extends KnownKeys<EV> & keyof EV = KnownKeys<EV> & keyof EV>(
    type: N,
    handler: EV[N]
  ): this;
  once(type: string, handler: EchoHandler | EchoHandler[]): this;
  once(type: string, handler: EchoHandler | EchoHandler[]): this {
    const fn = (...args: any[]) => {
      const handlers = normalizeHandler(handler);

      this.off(type, fn);

      handlers.forEach(h => h.call(this, ...args));
    };

    this.on(type, fn);

    return this;
  }

  on<EV extends EchoEvents = E, N extends KnownKeys<EV> & keyof EV = KnownKeys<EV> & keyof EV>(
    type: N,
    handler: EV[N]
  ): this;
  on(type: string, handler: EchoHandler | EchoHandler[]): this;
  on(type: string, handler: EchoHandler | EchoHandler[]): this {
    const event = this.listeners[type] || { handlers: [] };
    const handlers = event.handlers;
    const newHandlers = normalizeHandler(handler);

    newHandlers.forEach(h => {
      addItem(handlers, h);
    });

    this.listeners[type] = event;

    return this;
  }

  off<EV extends EchoEvents = E, N extends KnownKeys<EV> & keyof EV = KnownKeys<EV> & keyof EV>(
    type: N,
    handler?: EV[N]
  ): this;
  off(type: string, handler?: EchoHandler | EchoHandler[]): this;
  off(type: string, handler?: EchoHandler | EchoHandler[]): this {
    const [eventType, namespace] = parseType(type);

    if (namespace) {
      off(this, type as string, handler);
    } else {
      handleEventListeners.call(this, eventType, (n: string) => off(this, n, handler));
    }

    return this;
  }
}

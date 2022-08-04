export type EventHandler = (...args: any[]) => any;
export type EventOptions = {
  noOff?: boolean;
};
export type EventElement = {
  handlers: EventHandler[];
  options?: EventOptions;
};

function emit(this: Evento, name: string, ...args: any[]) {
  const event = this.events[name];

  if (event) {
    const handlers = event.handlers;

    handlers.forEach(h => h.call(this, ...args));
  }
}

function off(this: Evento, name: string, handler?: EventHandler) {
  const event = this.events[name];

  if (event) {
    const { handlers, options = {} } = event;

    if (!options.noOff) {
      if (handler) {
        handlers.splice(handlers.indexOf(handler), 1);
      } else {
        delete this.events[name];
      }
    }
  }
}

function handleEventHandlers(this: Evento, eventName: string, fn: any) {
  Object.keys(this.events).forEach((name: string) => {
    const [n] = parseName(name);

    if (n === eventName) {
      fn(name);
    }
  });
}

function parseName(name: string) {
  return name.split(':');
}

export default class Evento {
  events!: Record<string, EventElement>;

  constructor() {
    this.events = {};
  }

  emit(name: string, ...args: any[]): Evento {
    const [eventName, namespace] = parseName(name);

    if (namespace) {
      emit.call(this, name, ...args);
    } else {
      handleEventHandlers.call(this, eventName, (n: string) => emit.call(this, n, ...args));
    }

    return this;
  }

  once(name: string, handler: EventHandler): Evento {
    this.on(name, (...args: any[]) => {
      this.off(name, handler);

      handler.call(this, ...args);
    });

    return this;
  }

  on(name: string, handler: EventHandler, options?: EventOptions): Evento {
    const event = this.events[name] || { handlers: [] };
    const handlers = event.handlers;

    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }

    if (options) {
      event.options = options;
    }

    this.events[name] = event;

    return this;
  }

  off(name: string, handler?: EventHandler): Evento {
    const [eventName, namespace] = parseName(name);

    if (namespace) {
      off.call(this, name, handler);
    } else {
      handleEventHandlers.call(this, eventName, (n: string) => off.call(this, n, handler));
    }

    return this;
  }
}

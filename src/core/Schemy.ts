import { get, isPlainObject } from '@vue-formily/util';

import {
  EchoEvents,
  EventPayload,
  KnownKeys,
  SchemyConfig,
  SchemyEvents,
  BaseHook,
  SchemyInstance,
  SchemyInternalData,
  SchemyProps,
  SchemyReactiveData,
  SchemySchema,
  ConfigParam,
  Reactor
} from '@/types';
import { SCHEMY_HOOKS } from '../hooks/schemy';
import { genProps, mergeConfigs } from '../helpers';
import { createFormilyError, forEach } from '../utils';

import { HookMgr } from './HookMgr';
import { Echo } from './Echo';

export class Schemy<
  S extends SchemySchema = SchemySchema,
  C extends SchemyConfig = SchemyConfig,
  I extends SchemyInternalData<S, C> = SchemyInternalData<S, C>,
  R extends SchemyReactiveData = SchemyReactiveData
> extends Echo<any> {
  protected _d = {} as I;
  protected _r!: Reactor<R>;

  scope: string = 'schemy';

  hook = new HookMgr({
    context: this
  });

  constructor(schema: S, config?: ConfigParam<SchemyConfig>) {
    super();

    this._d.rawSchema = schema;
    this._d.rawConfig = mergeConfigs([{}, config]) as I['rawConfig'];
    this._d.config = mergeConfigs([{}, this.defaultConfig, this.rawConfig]) as I['config'];

    const { hooks = [], on: configOn, once: configOnce } = this.config;

    this.hook.attach(hooks);

    const context = this.hook.roll<BaseHook, 'base.setup'>('base.setup', {
      value: this,
      params: { schema, config: this.config }
    });

    this.on('error', event => {
      const {
        detail: { error, meta }
      } = event;

      this.emit<SchemyEvents, 'errorMonitor'>('errorMonitor', { error });

      const message = error instanceof Error ? error.message : error;

      throw createFormilyError(message, meta);
    });

    const { on, once, props = {} } = this.schema;

    this.setProps(props);

    // Register config handlers first, then schema handlers — both run (additive, not override)
    forEach(configOn ?? {}, (handler, name) => this.on(name, handler));
    forEach(on ?? {}, (handler, name) => this.on(name, handler));
    forEach(configOnce ?? {}, (handler, name) => this.once(name, handler));
    forEach(once ?? {}, (handler, name) => this.once(name, handler));

    return context as this;
  }

  get defaultConfig(): SchemyConfig {
    return {
      hooks: SCHEMY_HOOKS
    };
  }

  get rawConfig() {
    return this._d.rawConfig;
  }

  get rawSchema() {
    return this._d.rawSchema;
  }

  get config() {
    return this._d.config as C;
  }

  get data() {
    return this._r.get('data');
  }

  get schema() {
    return this.hook.roll<BaseHook>('base.schema', {
      value: this._d.rawSchema
    }) as S;
  }

  get props() {
    return this._r.get('props');
  }

  setProps(props: SchemyProps) {
    genProps(this, this._r.get('props'), props);
  }

  removeProps(keys: string | string[] | Array<string | string[]>) {
    const paths = Array.isArray(keys) ? keys : [keys];

    paths.forEach(key => {
      // Clone the array to avoid mutating the caller's input via pop()
      const path = Array.isArray(key) ? [...key] : key.split('.');
      const keyName = path.pop();
      const parent = get(path, this._r);

      if (keyName && keyName in parent) {
        delete parent[keyName];
      }
    });
  }

  throw(error: string | Error, meta?: Record<string, any>) {
    this.emit('error', { error, meta });
  }

  emit<
    P extends EventPayload = EventPayload<{
      target: SchemyInstance;
      currentTarget: SchemyInstance;
    }>
  >(payload: P): this;
  emit<EV extends EchoEvents = EchoEvents, N extends KnownKeys<EV> & keyof EV = KnownKeys<EV> & keyof EV>(
    type: N,
    detail?: any,
    ...args: any[]
  ): this;
  emit(name: string, detail?: any): this;
  emit(typeOrEvent: any, detail?: any) {
    const event = isPlainObject(typeOrEvent)
      ? {
          ...typeOrEvent,
          currentTarget: this,
          detail
        }
      : {
          type: typeOrEvent,
          target: this,
          currentTarget: this,
          detail
        };
    const type = event.type;

    return super.emit(type, event);
  }
}

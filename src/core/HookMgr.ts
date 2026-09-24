import { Hook, HookHandler, HookMgrOptions, HookPayload, HookToPayloads } from '@/types';
import { forEach } from '../utils';
import { Echo } from './Echo';

export class HookMgr<H extends Hook = Hook> extends Echo {
  options: HookMgrOptions = {};

  constructor(options: HookMgrOptions = {}) {
    super();

    this.options = options;

    const { hooks = [] } = options;

    this.attach(hooks);
  }

  roll<
    DH extends Hook = H,
    K extends keyof HookToPayloads<DH> = keyof HookToPayloads<DH>,
    P extends HookToPayloads<DH> = HookToPayloads<DH>
  >(name: K, payload?: Partial<P[K]>): P[K] extends { value: infer V } ? V : never;
  roll(name: string, payload?: HookPayload): HookPayload['value'];
  roll<V extends HookPayload = HookPayload>(name: string, payload = {} as V): V {
    const { context } = this.options;
    const currentPayload = {
      context,
      meta: {},
      params: {},
      ...payload
    } as HookPayload<any>;

    this.emit(name, currentPayload);

    return currentPayload.value;
  }

  attach(hookOrHooks: Hook | Hook[]) {
    const hooks = Array.isArray(hookOrHooks) ? hookOrHooks : [hookOrHooks];

    forEach(hooks, ({ name, scope, handlers }) => {
      forEach(handlers, (handler, funcName) => {
        const extensionPoint = `${name}.${funcName}${scope ? ':' + scope : ''}`;

        this.on(extensionPoint, handler);
      });
    });
  }

  detach(extensionPoint: string, handler?: HookHandler) {
    this.off(extensionPoint, handler);
  }
}

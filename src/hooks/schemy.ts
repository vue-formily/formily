import { createReactor } from '@/core/reactor';
import { BaseHook } from '@/types/hooks';
import { def } from '../utils';

export const SCHEMY_HOOKS = [
  {
    name: 'base',
    handlers: {
      prop(payload) {
        return payload;
      },
      schema(payload) {
        return payload;
      },
      setup(payload) {
        const instance = payload.value;
        const {
          params: { config }
        } = payload;
        const { plugs = [], reactor = createReactor } = config;
        const reactiveData = reactor({
          data: {},
          props: {}
        });

        def(instance, '_r', {
          get: () => reactiveData
        });

        plugs.forEach(plugin => plugin(instance));

        return payload;
      }
    }
  } as BaseHook
];

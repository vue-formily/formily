import { merge } from '@vue-formily/util';
import {
  ElementHook,
  ElementInternalData,
  ElementReactiveData,
  BaseHook,
  ElementInstance,
  ExtendHook,
  HookHandler,
  ElementSchema,
  Reactor
} from '@/types';
import { toRaw } from '../helpers';
import { ELEMENT_TYPES } from '../constants';

export const ELEMENT_HOOKS = [
  {
    name: 'base',
    scope: 'element',
    handlers: {
      setup(payload) {
        const {
          params: {
            schema: { options }
          }
        } = payload;
        const { _r, _d } = payload.value;

        _r.patch({
          shaken: false,
          invalidated: '',
          raw: '',
          value: null
        });
        _d.prevRaw = _r.get('raw');
        _d.prevValue = _r.get('value');
        _d.options = merge({}, options);

        return payload;
      }
    }
  } as ExtendHook<
    BaseHook,
    {
      handlers: {
        setup: HookHandler<{
          value: ElementInstance<any> & {
            _r: Reactor<ElementReactiveData>;
            _d: ElementInternalData;
          };
          context: ElementInstance<any>;
          params: {
            schema: ElementSchema;
          };
        }>;
      };
    }
  >,
  {
    name: 'element',
    handlers: {
      raw(payload) {
        payload.value = toRaw(payload.value);

        return payload;
      },
      value(payload) {
        return payload;
      },
      htmlName(payload) {
        const { context: element } = payload;
        const { ancestors } = element;
        const [root, ...rest] = [...ancestors, element].map(elem => {
          return 'index' in elem ? String(elem.index) : elem.formId;
        });
        const htmlName = rest ? `${root}[${rest.join('][')}]` : root;

        payload.value = (element as any).formType === ELEMENT_TYPES.COLLECTION ? `${htmlName}[]` : htmlName;

        return payload;
      }
    }
  } as ElementHook
];

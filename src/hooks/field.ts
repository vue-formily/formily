import { isUndefined } from '@vue-formily/util';
import {
  ElementHook,
  FieldSchema,
  BaseHook,
  FieldInstance,
  FieldInternalData,
  FieldReactiveData,
  HookHandler,
  ExtendHook,
  Reactor
} from '@/types';
import { FIELD_DATA_TYPES } from '../constants';
import { getValues } from '../utils';
import { getFieldValue, toRaw } from '@/helpers';

const [DATA_TYPES] = getValues(FIELD_DATA_TYPES);

export const FIELD_HOOKS = [
  {
    name: 'element',
    scope: 'field',
    handlers: {
      value(payload) {
        const { context: field } = payload;

        payload.value = getFieldValue(field);

        return payload;
      }
    }
  } as ExtendHook<
    ElementHook,
    {
      handlers: {
        value: HookHandler<{
          context: FieldInstance<any>;
        }>;
      };
    }
  >,
  {
    name: 'base',
    handlers: {
      schema(payload) {
        const { context: field } = payload;
        const { type } = payload.value as FieldSchema;

        if (type && !DATA_TYPES.includes(type)) {
          field.throw('Invalid `type`');
        }

        return payload;
      },
      setup(payload) {
        const {
          context: field,
          params: {
            schema: { value, default: defu }
          }
        } = payload;
        const { _r, _d } = payload.value;

        _r.patch({
          raw: toRaw(!isUndefined(value) ? value : defu),
          value: getFieldValue(field)
        });
        _d.default = !isUndefined(defu) ? defu : null;
        _d.prevRaw = _r.get('raw');
        _d.prevValue = _r.get('value');

        return payload;
      }
    }
  } as ExtendHook<
    BaseHook,
    {
      handlers: {
        schema: HookHandler<{
          value: FieldSchema;
          context: FieldInstance<any>;
        }>;
        setup: HookHandler<{
          value: FieldInstance<any> & {
            _d: FieldInternalData;
            _r: Reactor<FieldReactiveData>;
          };
          context: FieldInstance<any>;
          params: {
            schema: FieldSchema;
          };
        }>;
      };
    }
  >
];

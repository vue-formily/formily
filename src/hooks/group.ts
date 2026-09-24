import { isString } from '@vue-formily/util';

import {
  ElementHook,
  ElementInstance,
  ExtendHook,
  GroupHook,
  GroupInstance,
  GroupSchema,
  HookHandler,
  BaseHook
} from '@/types';
import { genAlias, genEnumValue, isElementsValid } from '../helpers';
import { findItem } from '../utils';

import { ELEMENT_TYPES } from '../constants';

const { GROUP, COLLECTION } = ELEMENT_TYPES;

export const GROUP_HOOKS = [
  {
    name: 'base',
    scope: 'group',
    handlers: {
      schema(payload) {
        const { fields } = payload.value;

        if (!Array.isArray(fields)) {
          payload.context.throw(__DEV__ ? '`fields` must be an array.' : '5');
        }

        return payload;
      }
    }
  } as ExtendHook<
    BaseHook,
    {
      handlers: {
        schema: HookHandler<{
          value: GroupSchema;
          context: GroupInstance<any>;
        }>;
        setup?: HookHandler<{
          value: GroupInstance<any>;
          context: GroupInstance<any>;
        }>;
      };
    }
  >,
  {
    name: 'element',
    scope: 'group',
    handlers: {
      raw(payload) {
        const { context: group } = payload;
        payload.value = genEnumValue(group, { prop: 'raw' });

        return payload;
      },
      value(payload) {
        const { context: group } = payload;
        payload.value = isElementsValid(group) ? genEnumValue(group) : null;

        return payload;
      }
    }
  } as ExtendHook<
    ElementHook,
    {
      handlers: {
        raw: HookHandler<{
          context: GroupInstance<any>;
        }>;
        value: HookHandler<{
          context: GroupInstance<any>;
        }>;
      };
    }
  >,
  {
    name: 'group',
    handlers: {
      addField(payload) {
        const {
          context: group,
          params: { schema, options = {} }
        } = payload;
        const { elements = [] } = group.config;
        const { formId, formType } = schema;
        const ElementConstrutor = elements.find((e: any) => e.FORM_TYPE === formType);
        const length = elements.length;

        if (!length) {
          group.throw(__DEV__ ? 'No form elements have been registered yet' : '6');
        } else if (!ElementConstrutor) {
          group.throw(__DEV__ ? '`formType` is not defined or supported' : '7', {
            formId
          });
        }

        const { rawConfig, config } = group;
        const { shared, plugs, reactor, validation, ...scopes } = config;
        const { FORM_TYPE } = ElementConstrutor;
        let elementConfig = [{ plugs, reactor, shared, validation }, (scopes as any)[FORM_TYPE], { parent: group }];

        if (FORM_TYPE === GROUP) {
          elementConfig = [rawConfig, { parent: group }];
        } else if (FORM_TYPE === COLLECTION) {
          elementConfig = [
            {
              [GROUP]: rawConfig
            },
            ...elementConfig
          ];
        }

        const field = new ElementConstrutor({ value: options.value, ...schema }, elementConfig) as ElementInstance<any>;
        const alias = genAlias(field.model);

        if (alias in group) {
          group.throw(__DEV__ ? `Duplicated model: ${field.model}` : '8');
        }

        payload.value = field;

        (group as any)[alias] = field;

        return payload;
      },
      removeField(payload) {
        const {
          context: group,
          params: { target }
        } = payload;

        if (isString(target)) {
          const { item } = findItem<ElementInstance>(group.fields, target, {
            key: 'formId'
          });

          payload.value = item;
        } else {
          payload.value = target;
        }

        const alias = genAlias(payload.value.model);

        delete (group as any)[alias];

        return payload;
      }
    }
  } as GroupHook
];

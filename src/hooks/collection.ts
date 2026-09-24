import { isNumber, isPlainObject } from '@vue-formily/util';

import {
  GroupSchema,
  CollectionHook,
  CollectionElementInstance,
  BaseHook,
  CollectionSchema,
  CollectionInstance,
  ElementHook,
  ExtendHook,
  HookHandler
} from '@/types';
import { isElementsValid } from '../helpers';

import { CollectionElement } from '../core/elements/CollectionElement';

export const COLLECTION_HOOKS = [
  {
    name: 'base',
    scope: 'collection',
    handlers: {
      schema(payload) {
        const { context: collection } = payload;

        const { group } = payload.value as CollectionSchema;

        if (!isPlainObject(group)) {
          collection.throw(__DEV__ ? '`group` must be an object' : '4');
        }

        return payload;
      }
    }
  } as BaseHook,
  {
    name: 'element',
    scope: 'collection',
    handlers: {
      raw(payload) {
        const { context: collection } = payload;

        payload.value = collection.groups.map(({ raw }) => raw);

        return payload;
      },
      value(payload) {
        const { context: collection } = payload;

        payload.value = isElementsValid(collection) ? collection.groups.map(({ value }) => value) : null;

        return payload;
      }
    }
  } as ExtendHook<
    ElementHook,
    {
      handlers: {
        raw: HookHandler<{
          context: CollectionInstance<any>;
        }>;
        value: HookHandler<{
          context: CollectionInstance<any>;
        }>;
      };
    }
  >,
  {
    name: 'collection',
    handlers: {
      addGroup(payload) {
        const {
          context: collection,
          params: { options = {} }
        } = payload;
        const groupSchema = collection.schema.group;
        const { shared, plugs, reactor, validation, ...scopes } = collection.config;
        const elementConfig = [{ plugs, reactor, shared, validation }, scopes.group, { parent: collection }];

        const collectionElement = new CollectionElement(
          {
            formType: 'group',
            value: options.value,
            ...groupSchema
          } as GroupSchema,
          elementConfig
        );

        payload.value = collectionElement as unknown as CollectionElementInstance<any>;

        return payload;
      },
      removeGroup(payload) {
        const {
          context: collection,
          params: { target }
        } = payload;

        payload.value = isNumber(target) ? (collection.groups[target] as CollectionElementInstance<any>) : target;

        return payload;
      }
    }
  } as CollectionHook
];

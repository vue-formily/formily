import { Hook, HookHandler } from './hook';
import {
  CollectionElementInstance,
  CollectionInstance,
  ElementInstance,
  FieldInstance,
  GroupInstance,
  RuleInstance,
  SchemyInstance
} from './instances';
import { SchemyConfig, SchemySchema } from './schemy';
import { CollectionAddGroupOptions, ElementSchema, FieldValue, GroupAddFieldOptions } from './elements';
import { ValidatorProps } from './validation';

export type BaseHook = Hook<
  'base',
  {
    handlers: {
      prop?: HookHandler<{
        value: Record<string, any>;
        context: SchemyInstance<any>;
      }>;
      schema?: HookHandler<{
        value: SchemySchema;
        context: SchemyInstance<any>;
      }>;
      setup?: HookHandler<{
        value: SchemyInstance<any>;
        context: SchemyInstance<any>;
        params: {
          schema: SchemySchema;
          config: SchemyConfig;
        };
      }>;
    };
  }
>;

export type ElementHook = Hook<
  'element',
  {
    handlers: {
      raw?: HookHandler<{
        value: any;
        context: ElementInstance<any>;
      }>;
      value?: HookHandler<{
        value: any;
        context: ElementInstance<any>;
      }>;
      htmlName?: HookHandler<{
        value: any;
        context: ElementInstance<any>;
      }>;
    };
  }
>;

export type FieldHook = Hook<
  'field',
  {
    handlers: {
      raw?: HookHandler<{
        value: FieldValue;
        context: FieldInstance<any>;
      }>;
    };
  }
>;

export type ContainerHook = Hook<
  'container',
  {
    handlers: Record<string, any>;
  }
>;

export type CollectionHook = Hook<
  'collection',
  {
    handlers: {
      addGroup?: HookHandler<{
        value: CollectionElementInstance<any>;
        context: CollectionInstance<any>;
        params: {
          options?: CollectionAddGroupOptions;
        };
      }>;
      removeGroup?: HookHandler<{
        value: CollectionElementInstance<any> | undefined;
        context: CollectionInstance<any>;
        params: {
          target?: CollectionElementInstance<any> | number;
        };
      }>;
    };
  }
>;

export type GroupHook = Hook<
  'group',
  {
    handlers: {
      addField?: HookHandler<{
        value: ElementInstance<any>;
        context: GroupInstance<any>;
        params: {
          schema: ElementSchema<any>;
          options?: GroupAddFieldOptions;
        };
      }>;
      removeField?: HookHandler<{
        value: ElementInstance<any> | undefined;
        context: GroupInstance<any>;
        params: {
          target: ElementInstance<any> | string;
        };
      }>;
    };
  }
>;

export type RuleHook = Hook<
  'rule',
  {
    handlers: {
      validatorProps?: HookHandler<{
        value: ValidatorProps;
        context: RuleInstance;
      }>;
      message?: HookHandler<{
        value: string;
        context: RuleInstance;
      }>;
    };
  }
>;

export type ValidationHook = Hook<
  'validation',
  {
    handlers: Record<string, any>;
  }
>;

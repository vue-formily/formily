import { ValidationConfig, ValidationRuleSchema } from './validation';
import { SchemyConfig, SchemyInternalData, SchemyReactiveData, SchemySchema } from './schemy';
import { ValueOf } from './generic';
import { ELEMENT_TYPES, FIELD_DATA_TYPES } from '../constants';
import { SharedConfig } from './config';
import {
  CollectionEvents,
  ContainerEvents,
  ElementEvents,
  FieldEvents,
  FormEvents,
  GroupEvents
} from './instanceEvents';
import { EchoEvents } from './events';

export type ElementScopes = {
  validation?: ValidationConfig;
};
export type ElementConfig<
  P = Record<string, any>,
  SC extends Record<string, any> = Record<string, any>
> = SchemyConfig & {
  parent?: P;
} & SC;
export type ElementInternalData<
  S extends ElementSchema<any> = ElementSchema<any>,
  C extends ElementConfig = ElementConfig,
  R = any,
  V = any
> = SchemyInternalData<S, C> & {
  schema: S;
  options: ElementOptions;
  parent?: C['parent'];
  prevRaw: R;
  value: V;
  prevValue: V;
};
export type ElementReactiveData<R = any, V = any> = SchemyReactiveData & {
  shaken: boolean;
  invalidated: string;
  raw: R;
  value: V;
  dirty: boolean;
};

export type ContainerConfig<
  P extends Record<string, any> = Record<string, any>,
  SC extends Record<string, any> = Record<string, any>
> = ElementConfig<P, SC> & {
  shared?: SharedConfig;
};
export type GroupScopes = ElementScopes & {
  [ELEMENT_TYPES.FIELD]?: FieldConfig;
  [ELEMENT_TYPES.COLLECTION]?: CollectionConfig;
};
export type GroupConfig<
  P extends Record<string, any> = Record<string, any>,
  SC extends GroupScopes = GroupScopes
> = ContainerConfig<P, SC> & {
  elements?: any[];
};
export type FormConfig = GroupConfig;
export type CollectionScopes = ElementScopes & {
  [ELEMENT_TYPES.GROUP]?: GroupConfig;
};
export type CollectionConfig<
  P extends Record<string, any> = Record<string, any>,
  SC extends CollectionScopes = CollectionScopes
> = ContainerConfig<P, SC>;

export type FieldConfig<P extends Record<string, any> = Record<string, any>> = ElementConfig<P>;
export type FieldInternalData<
  S extends FieldSchema = FieldSchema,
  C extends FieldConfig = FieldConfig
> = ElementInternalData<S, C, string, FieldValue> & {
  checkedValue?: string;
  default: any;
  initialValue: FieldValue;
};
export type FieldReactiveData = ElementReactiveData<string, FieldValue>;
export type FieldRaw = string;

export type ContainerAddElementOptions = {
  at?: number;
  value?: any;
};
export type ContainerInternalData<
  S extends ContainerSchema<any> = ContainerSchema<any>,
  C extends ContainerConfig = ContainerConfig,
  PR = any,
  PV = any
> = ElementInternalData<S, C, PR, PV>;
export type ContainerReactiveData<
  E extends Record<string, any> = Record<string, any>,
  R = any,
  V = any
> = ElementReactiveData<R, V> & {
  elements: E[];
};

export type GroupInternalData<
  S extends GroupSchema = GroupSchema,
  C extends GroupConfig = GroupConfig
> = ContainerInternalData<S, C> & {
  prevRaw: Record<string, any>;
  schema: GroupSchema;
};
export type GroupReactiveData<E extends Record<string, any> = Record<string, any>> = ContainerReactiveData<E> & {
  aliases: Record<string, any>;
};
export type GroupRaw = Record<string, any>;
export type GroupValue = Record<string, any>;

export type CollectionInternalData<
  S extends CollectionSchema = CollectionSchema,
  C extends CollectionConfig = CollectionConfig
> = ContainerInternalData<S, C> & {
  schema: CollectionSchema;
};
export type CollectionReactiveData<E extends Record<string, any> = Record<string, any>> = ContainerReactiveData<E>;
export type CollectionRaw = GroupRaw[];
export type CollectionValue = GroupValue[];

export type ElementOptions = Record<string, any>;

export type ElementSchema<T extends string = string, E extends EchoEvents = ElementEvents> = SchemySchema<E> & {
  formId: string;
  formType: T;
  model?: string;
  options?: ElementOptions;
  rules?: ValidationRuleSchema[];
};

export type AnySchema = FieldSchema<any> | GroupSchema<any> | CollectionSchema<any>;
export type AnyConfigs = FieldConfig | GroupConfig | CollectionConfig;
export type AnyElementTypes = typeof ELEMENT_TYPES;

export type ContainerSchema<T extends string, E extends EchoEvents = ContainerEvents> = ElementSchema<T, E>;

export interface GroupSchema<
  T extends string = AnyElementTypes['GROUP'],
  E extends EchoEvents = GroupEvents<any>
> extends ContainerSchema<T, E> {
  fields: AnySchema[];
  value?: GroupValue;
}

export type FormSchema<
  T extends string = AnyElementTypes['GROUP'],
  E extends EchoEvents = FormEvents<any>
> = GroupSchema<T, E>;

export type CollectionElementSchema = Omit<GroupSchema, 'formId' | 'formType'>;

export interface CollectionSchema<
  T extends string = AnyElementTypes['COLLECTION'],
  E extends EchoEvents = CollectionEvents<any>
> extends ContainerSchema<T, E> {
  group: CollectionElementSchema;
  value?: CollectionValue;
}

export type CollectionAddGroupOptions = ContainerAddElementOptions;
export type GroupAddFieldOptions = ContainerAddElementOptions;

export type FieldType = ValueOf<typeof FIELD_DATA_TYPES>;
export type FieldValue = string | number | boolean | Date | null;
export type InferFieldValue<T> = T extends 'date'
  ? Date
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'string'
        ? string
        : never;

export interface FieldSchema<E extends EchoEvents = FieldEvents<any>> extends ElementSchema<
  AnyElementTypes['FIELD'],
  E
> {
  type?: FieldType;
  default?: FieldValue;
  value?: FieldValue;
  checkedValue?: string;
}

import { EventHandler } from '../Evento';
import { ValidationRuleSchema } from '../validations/types';
import { Builtin } from '../../utils-types';

export type ElementOptions = {
  silent?: boolean;
};

export interface ElementSchema<I = string> {
  formId: I;
  model?: I;
  props?: Record<string, any>;
  on?: Record<string, EventHandler>;
  options?: ElementOptions;
  rules?: ValidationRuleSchema<I>[];
}

export type ElementsSchemas<I = string> = FieldSchema<I> | GroupSchema<I> | CollectionSchema<I>;

export interface GroupSchema<I = string> extends ElementSchema<I> {
  formType: 'group';
  fields: ElementsSchemas<I>[];
  value?: any;
}

export type CollectionItemSchema<I = string> = Omit<GroupSchema<I>, 'formId' | 'formType'>;

export interface CollectionSchema<I = string> extends ElementSchema<I> {
  formType: 'collection';
  group: CollectionItemSchema<I>;
  value?: any;
}

export type FormSchema<I = string> = GroupSchema<I>;

export type FieldType = 'string' | 'number' | 'boolean' | 'date';
export type FieldValue = string | number | boolean | Date | null;

export type Format = string | ((field: any) => string);

export interface FieldSchema<I = string> extends ElementSchema<I> {
  type?: FieldType;
  formType: 'field';
  format?: Format;
  default?: any;
  value?: any;
  checkedValue?: any;
}

export type ReadonlySchema<T> = T extends Builtin
  ? T
  : T extends Array<any>
  ? Readonly<T>
  : T extends Record<string, any>
  ? { readonly [K in keyof T]: ReadonlySchema<T[K]> }
  : Readonly<T>;

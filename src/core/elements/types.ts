import { EventHandler } from '../Evento';
import Validation from '../validations/Validation';
import { ValidationRuleSchema } from '../validations/types';

export type ElementOptions = {
  silent?: boolean;
};

export interface ElementSchema<I = string> {
  formId?: I;
  model?: I;
  props?: Record<string, any>;
  on?: Record<string, EventHandler>;
  options?: ElementOptions;
  rules?: ValidationRuleSchema<I>[];
}

export interface ElementData {
  ancestors: any[] | null;
  schema: any;
  validation: Validation;
  options: ElementOptions;
}

// export type Elements = typeof Field | typeof Group | typeof Collection;

export type ElementsSchemas<I = string> = FieldSchema<I> | GroupSchema<I> | CollectionSchema<I>;

export interface GroupSchema<I = string> extends ElementSchema<I> {
  fields: ElementsSchemas<I>[];
}

export interface CollectionSchema<I = string> extends ElementSchema<I> {
  group: Omit<GroupSchema<I>, 'formId'>;
}

export type FormSchema<I = string> = GroupSchema<I>;

export type FieldType = 'string' | 'number' | 'boolean' | 'date';
export type FieldValue = string | number | boolean | Date | null;

export type Format = string | ((field: any) => string);

export interface FieldSchema<I = string> extends ElementSchema<I> {
  type?: FieldType;
  format?: Format;
  default?: any;
  value?: any;
  checkedValue?: any;
}

import { EventHandler } from '../Evento';
import Validation from '../validations/Validation';
import { ValidationRuleSchema } from '../validations/types';

export type ElementOptions = {
  silent?: boolean;
};

export interface ElementSchema {
  formId?: string;
  model?: string;
  props?: Record<string, any>;
  on?: Record<string, EventHandler>;
  options?: ElementOptions;
}

export interface ElementData {
  ancestors: any[] | null;
  schema: any;
  validation: Validation;
  options: ElementOptions;
}

export interface GroupSchema extends ElementSchema {
  fields: (FieldSchema | GroupSchema | CollectionSchema)[];
  rules?: ValidationRuleSchema[];
}

export interface CollectionSchema extends ElementSchema {
  group: Omit<GroupSchema, 'formId'>;
  rules?: ValidationRuleSchema[];
}

export type FormSchema = GroupSchema;

export type FieldType = 'string' | 'number' | 'boolean' | 'date';
export type FieldValue = string | number | boolean | Date | null;

export type Format = string | ((field: any) => string);

export interface FieldSchema extends ElementSchema {
  type?: FieldType;
  format?: Format;
  default?: any;
  value?: any;
  rules?: ValidationRuleSchema[];
  checkedValue?: any;
}

import {
  ElementsSchemas,
  ElementOptions,
  FieldSchema,
  FieldType,
  FieldValue,
  GroupSchema,
  CollectionSchema
} from './types';
import { UnionToIntersection } from '../../utils-types';
import Objeto from '../Objeto';
import Pender from '../Pender';
import { RuleSchema, Validator } from '../validations/types';

export type RuleInstance = {
  readonly name: string;
  message: string | null;
  validator?: Validator | null;
  context: Record<string, any> | null;
  container: Record<string, any> | null;
  valid: boolean;
  error: string | null;
  schema: RuleSchema<string> | Validator;
  setMessage(message?: string | null): void;
  reset(): void;
  validate(value: any, props?: Record<string, any> | undefined, ...args: any[]): Promise<RuleInstance>;
} & Objeto;

export type ValidationInstance = {
  rules: RuleInstance[];
  context: Record<string, any> | null;
  valid: boolean;
  errors: (string | null)[] | null;
  schema: (RuleSchema<string> | Validator | undefined)[] | null;
  getSchema(): (RuleSchema<string> | Validator | undefined)[] | null;
  addRule(
    ruleOrSchema: RuleInstance | Validator | RuleSchema,
    options?: {
      at?: number;
    }
  ): RuleInstance;
  removeRule(remove: RuleInstance | string): RuleInstance;
  reset(): void;
  validate(
    value: any,
    options?: {
      excluded?: string[];
      get?: string[];
    },
    ...args: any[]
  ): Promise<ValidationInstance>;
} & Objeto;

export type ElementInstance = {
  readonly parent: ElementInstance | null;
  readonly model: string;
  readonly type: string;
  props: Record<string, any>;
  data: WeakMap<Record<string, unknown>, any>;
  shaked: boolean;
  pending: boolean;
  pender: Pender;
  readonly options: ElementOptions;
  readonly validation: ValidationInstance;
  readonly error: string;
  readonly schema: Record<string, any>;
  getProps(
    path: string,
    options?: {
      up?: boolean;
    }
  ): any;
  addProps(props: Record<string, any>, ...args: any[]): void;
  readonly formId: string;
  readonly htmlName: string;
  readonly valid: boolean;
  getHtmlName(): string;
  shake(): void;
  cleanUp(): void;
  getSchema(): Record<string, any>;
} & Objeto;

export type CustomValidationProperty<R> = R extends Record<string, any>
  ? {
      [key in R['name']]: RuleInstance;
    }
  : never;

export type CascadeRule<P, R> = R extends Record<string, unknown>
  ? R['inherit'] extends false
    ? R
    : P extends Record<string, unknown>
    ? P['cascade'] extends true
      ? R & P
      : R
    : R
  : P extends Record<string, unknown>
  ? P['cascade'] extends true
    ? P
    : never
  : never;

export type CustomVariationProperties<R, E = undefined> = UnionToIntersection<
  CustomValidationProperty<
    R extends any[]
      ? CascadeRule<E extends any[] ? E[number] : E, R[number]>
      : CascadeRule<E extends any[] ? E[number] : E, R>
  >
> &
  ValidationInstance;

export type CustomGroupProperty<F, R extends any[]> = F extends Record<string, any>
  ? {
      [key in `$${F['formId']}`]: F['fields'] extends Readonly<unknown[]>
        ? GroupInstance<F, R>
        : F['group'] extends Readonly<Record<string, unknown>>
        ? CollectionInstance<F, R>
        : F extends FieldSchema
        ? FieldInstance<F, R>
        : never;
    }
  : never;

export type CustomGroupProperties<T extends Record<string, any>, R extends any[] = T['rules']> = UnionToIntersection<
  CustomGroupProperty<T['fields'][number], R>
>;

export type FieldInstance<
  T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>,
  R extends Readonly<any[]> = T['rules']
> = {
  validation: CustomVariationProperties<T['rules'], R>;
  readonly type: FieldType;
  readonly formType: 'field';
  readonly default: any;
  readonly formatted: string;
  raw: any;
  setRaw(value: any): Promise<void>;
  value: FieldValue;
  setValue(value: any): Promise<any>;
  setCheckedValue(checkedValue: any): void;
  readonly checked: any;
  isValid(): boolean;
  reset(): void;
  clear(): Promise<void>;
  validate(): Promise<void>;
} & ElementInstance;

export type GroupInstance<
  T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>,
  R extends Readonly<any[]> = T['rules']
> = UnionToIntersection<CustomGroupProperties<T>> & {
  validation: CustomVariationProperties<T['rules'], R>;
  fields: T['fields'];
  readonly type: 'enum';
  readonly formType: 'group';
  readonly value: Record<string, any>;
  setValue(obj: Record<string, any>): Promise<Record<string, any>>;
  shake(options?: { cascade?: boolean }): void;
  isValid(): boolean;
  reset(): void;
  clear(): Promise<void>;
  addField(schema: ElementsSchemas, options?: { at?: number }): ElementInstance;
  removeField(elementOrId: Record<string, any> | string): void;
  getSchema(): GroupSchema;
  validate(options?: { cascade?: boolean }): Promise<void>;
} & ElementInstance;

export type FormInstance<
  T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>,
  R extends Readonly<any[]> = T['rules']
> = UnionToIntersection<CustomGroupProperties<T>> & {
  validation: CustomVariationProperties<T['rules'], R>;
  fields: T['fields'];
  readonly type: 'enum';
  readonly formType: 'group';
  readonly value: Record<string, any>;
  setValue(obj: Record<string, any>): Promise<Record<string, any>>;
  shake(options?: { cascade?: boolean }): void;
  isValid(): boolean;
  reset(): void;
  clear(): Promise<void>;
  addField(schema: ElementsSchemas, options?: { at?: number }): ElementInstance;
  removeField(elementOrId: Record<string, any> | string): void;
  getSchema(): GroupSchema;
  validate(options?: { cascade?: boolean }): Promise<void>;
} & ElementInstance;

export type CollectionInstance<
  T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>,
  R extends Readonly<any[]> = T['rules']
> = {
  groups: Array<CollectionItemInstance<T>>;
  validation: CustomVariationProperties<T['rules'], R>;
  readonly type: 'set';
  readonly formType: 'collection';
  readonly value: any[];
  setValue(
    value: any[],
    {
      from,
      autoAdd
    }?: {
      from?: number;
      autoAdd?: boolean;
    }
  ): Promise<any[]>;
  shake(options?: { cascade?: boolean }): void;
  isValid(): boolean;
  reset(): void;
  clear(): Promise<void>;
  addGroup(): CollectionItemInstance<T>;
  removeGroup(itemOrIndex: CollectionItemInstance<T> | number): void;
  validate(options?: { cascade?: boolean }): Promise<void>;
  addField(schema: ElementsSchemas, options?: { at?: number }): ElementInstance[];
  removeField(id: string): (ElementInstance | null)[];
  getSchema(): CollectionSchema;
} & ElementInstance;

export type CollectionItemInstance<T extends Record<string, any>> = T['group'] extends Readonly<Record<string, unknown>>
  ? CustomGroupProperties<T['group']> & {
      readonly index: number;
    } & GroupInstance
  : Exclude<T['groups'], null> extends any[]
  ? Exclude<T['groups'], null>[number]
  : never;

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
import { RuleSchema, Validator } from '../validations/types';

export type RuleInstance = {
  readonly name: string | number;
  readonly pending: boolean;
  message?: string | ((...args: any[]) => string);
  validator: Validator;
  context: Record<string, any> | null;
  container: Record<string, any> | null;
  valid: boolean;
  error: string | null;
  getSchema(): Validator | RuleSchema;
  reset(): void;
  validate(value: any, props?: Record<string, any> | undefined, ...args: any[]): Promise<RuleInstance>;
} & Objeto;

export type ValidationInstance = {
  readonly pending: boolean;
  readonly context: Record<string, any> | null;
  rules: RuleInstance[];
  valid: boolean;
  errors: (string | null)[] | null;
  getSchema(): (Validator | RuleSchema<string | number>)[] | null;
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
  readonly data: Record<string, any>;
  readonly props: Record<string, any>;
  readonly shaked: boolean;
  readonly pending: boolean;
  readonly options: ElementOptions;
  readonly validation: ValidationInstance;
  readonly error: string;
  readonly schema: Record<string, any>;
  readonly formId: string;
  readonly htmlName: string;
  readonly valid: boolean;
  getHtmlName(): string;
  shake(): void;
  cleanUp(): void;
  getSchema(): Record<string, any>;
  invalidate(message?: string | undefined): void;
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
  cast(value: any): FieldValue;
  setCheckedValue(checkedValue: any): void;
  readonly checked: any;
  isValid(): boolean;
  reset(): Promise<void>;
  clear(): Promise<void>;
  validate(): Promise<boolean>;
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
  setValue(obj: Record<string, any>): Promise<Record<string, any> | null>;
  shake(options?: { cascade?: boolean }): void;
  isValid(): boolean;
  reset(): Promise<void>;
  clear(): Promise<void>;
  addField(
    schema: ElementsSchemas,
    options?: {
      at?: number;
    }
  ): Promise<Element>;
  removeField(elementOrId: Record<string, any> | string): Promise<Element | null>;
  getSchema(): GroupSchema;
  validate(options?: { cascade?: boolean }): Promise<boolean>;
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
  setValue(obj: Record<string, any>): Promise<Record<string, any> | null>;
  shake(options?: { cascade?: boolean }): void;
  isValid(): boolean;
  reset(): Promise<void>;
  clear(): Promise<void>;
  addField(
    schema: ElementsSchemas,
    {
      at
    }?: {
      at?: number;
    }
  ): Promise<Element>;
  removeField(elementOrId: Record<string, any> | string): Promise<Element | null>;
  getSchema(): GroupSchema;
  validate(options?: { cascade?: boolean }): Promise<boolean>;
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
    options?: {
      from?: number;
      autoAdd?: boolean;
    }
  ): Promise<any[]>;
  shake(options?: { cascade?: boolean }): void;
  isValid(): boolean;
  reset(): Promise<void>;
  clear(): Promise<void>;
  addGroup<T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>>(): Promise<
    CollectionItemInstance<T>
  >;
  removeGroup<T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>>(
    itemOrIndex: CollectionItemInstance<T> | number
  ): Promise<CollectionItemInstance<T> | null>;
  validate(options?: { cascade?: boolean }): Promise<boolean>;
  addField(
    schema: ElementsSchemas,
    options?:
      | {
          at?: number | undefined;
        }
      | undefined
  ): Promise<void>;
  removeField(id: string): Promise<void>;
  getSchema(): CollectionSchema;
} & ElementInstance;

export type CollectionItemInstance<T extends Record<string, any>> = T['group'] extends Readonly<Record<string, unknown>>
  ? CustomGroupProperties<T['group']> & {
      readonly index: number;
    } & GroupInstance
  : Exclude<T['groups'], null> extends any[]
  ? Exclude<T['groups'], null>[number]
  : never;

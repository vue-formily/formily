// defineSchema is a utility that is primarily used for type inference
// when declaring form schemas. Type inference is provided in the component
// options (provided as the argument). The returned value has artificial types
// for TSX / manual render function / IDE support.

import { ELEMENT_TYPES } from './constants';
import {
  AnyElementTypes,
  AnySchema,
  CollectionEvents,
  CollectionInstance,
  CollectionSchema,
  ElementInstance,
  FieldEvents,
  FieldInstance,
  FieldSchema,
  FormEvents,
  FormInstance,
  FormSchema,
  GroupEvents,
  GroupInstance,
  GroupSchema,
  Override,
  Simplify
} from './types';
import { ValidationRuleSchema } from './types/validation';

export type ElementInput<Schema, TypeName extends string> = Override<
  Omit<Schema, 'formId' | 'on' | 'once'>,
  {
    formType?: TypeName;
  }
>;

export type FieldInput = ElementInput<FieldSchema, AnyElementTypes['FIELD']>;

export type GroupInput = ElementInput<GroupSchema, AnyElementTypes['GROUP']>;

export type FormInput = ElementInput<FormSchema, AnyElementTypes['GROUP']>;

export type CollectionInput = ElementInput<CollectionSchema, AnyElementTypes['COLLECTION']>;

export type FunctionEventStructure<E> = {
  [K in keyof E]?: E[K];
} & {
  [key: string]: any;
};

export type ArrayEventStructure<E> = {
  [K in keyof E]?: E[K][];
} & {
  [key: string]: any;
};

export type MixedEventStructure<E> = {
  [K in keyof E]?: E[K] | E[K][];
} & {
  [key: string]: any;
};

// =============================================================================
// 1. DEFINE FIELD
// =============================================================================

type GetFieldInstance<ID extends string, R> = FieldInstance<
  Simplify<{ formId: ID; formType: AnyElementTypes['FIELD'] } & Omit<R, 'formType'>>
>;
type GetFieldEvents<ID extends string, R> = FieldEvents<GetFieldInstance<ID, R>>;

export function defineField<const ID extends string, const R extends FieldInput>(
  schema: { formId: ID } & R & {
      on?: FunctionEventStructure<GetFieldEvents<ID, R>>;
      once?: FunctionEventStructure<GetFieldEvents<ID, R>>;
    } & ThisType<GetFieldInstance<ID, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['FIELD'] } & R>>;

export function defineField<const ID extends string, const R extends FieldInput>(
  schema: { formId: ID } & R & {
      on?: ArrayEventStructure<GetFieldEvents<ID, R>>;
      once?: ArrayEventStructure<GetFieldEvents<ID, R>>;
    } & ThisType<GetFieldInstance<ID, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['FIELD'] } & R>>;

export function defineField<const ID extends string, const R extends FieldInput>(
  schema: { formId: ID } & R & {
      on?: MixedEventStructure<GetFieldEvents<ID, R>>;
      once?: MixedEventStructure<GetFieldEvents<ID, R>>;
    } & ThisType<GetFieldInstance<ID, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['FIELD'] } & R>>;

export function defineField(schema: any) {
  return { ...schema, formType: ELEMENT_TYPES.FIELD };
}

// =============================================================================
// 2. DEFINE GROUP
// =============================================================================

type GetGroupInstance<ID extends string, F extends readonly any[], R> = GroupInstance<
  Simplify<
    {
      formId: ID;
      formType: AnyElementTypes['GROUP'];
      fields: F;
    } & Omit<R, 'formType'>
  >
>;

type GetGroupEvents<ID extends string, F extends readonly any[], R> = GroupEvents<
  ElementInstance<any>,
  GetGroupInstance<ID, F, R>
>;

export function defineGroup<const ID extends string, const F extends readonly any[], const R extends GroupInput>(
  schema: {
    formId: ID;
    fields: F;
  } & R & {
      on?: FunctionEventStructure<GetGroupEvents<ID, F, R>>;
      once?: FunctionEventStructure<GetGroupEvents<ID, F, R>>;
    } & ThisType<GetGroupInstance<ID, F, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['GROUP']; fields: F } & R>>;

export function defineGroup<const ID extends string, const F extends readonly any[], const R extends GroupInput>(
  schema: {
    formId: ID;
    fields: F;
  } & R & {
      on?: ArrayEventStructure<GetGroupEvents<ID, F, R>>;
      once?: ArrayEventStructure<GetGroupEvents<ID, F, R>>;
    } & ThisType<GetGroupInstance<ID, F, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['GROUP']; fields: F } & R>>;

export function defineGroup<const ID extends string, const F extends readonly any[], const R extends GroupInput>(
  schema: {
    formId: ID;
    fields: F;
  } & R & {
      on?: MixedEventStructure<GetGroupEvents<ID, F, R>>;
      once?: MixedEventStructure<GetGroupEvents<ID, F, R>>;
    } & ThisType<GetGroupInstance<ID, F, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['GROUP']; fields: F } & R>>;

export function defineGroup(schema: any) {
  return { ...schema, formType: ELEMENT_TYPES.GROUP };
}

// =============================================================================
// 2. DEFINE FORM
// =============================================================================

type GetFormInstance<ID extends string, F extends readonly any[], R> = FormInstance<
  Simplify<
    {
      formId: ID;
      formType: AnyElementTypes['GROUP'];
      fields: F;
    } & Omit<R, 'formType'>
  >
>;

type GetFormEvents<ID extends string, F extends readonly any[], R> = FormEvents<
  ElementInstance<any>,
  GetFormInstance<ID, F, R>
>;

export function defineForm<const ID extends string, const F extends readonly any[], const R extends FormInput>(
  schema: {
    formId: ID;
    fields: F;
  } & R & {
      on?: FunctionEventStructure<GetFormEvents<ID, F, R>>;
      once?: FunctionEventStructure<GetFormEvents<ID, F, R>>;
    } & ThisType<GetFormInstance<ID, F, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['GROUP']; fields: F } & R>>;

export function defineForm<const ID extends string, const F extends readonly any[], const R extends FormInput>(
  schema: {
    formId: ID;
    fields: F;
  } & R & {
      on?: ArrayEventStructure<GetFormEvents<ID, F, R>>;
      once?: ArrayEventStructure<GetFormEvents<ID, F, R>>;
    } & ThisType<GetFormInstance<ID, F, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['GROUP']; fields: F } & R>>;

export function defineForm<const ID extends string, const F extends readonly any[], const R extends FormInput>(
  schema: {
    formId: ID;
    fields: F;
  } & R & {
      on?: MixedEventStructure<GetFormEvents<ID, F, R>>;
      once?: MixedEventStructure<GetFormEvents<ID, F, R>>;
    } & ThisType<GetFormInstance<ID, F, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['GROUP']; fields: F } & R>>;

export function defineForm(schema: any) {
  return { ...schema, formType: ELEMENT_TYPES.GROUP };
}

// =============================================================================
// 3. DEFINE COLLECTION
// =============================================================================

type GetCollectionInstance<ID extends string, R> = CollectionInstance<
  Simplify<{ formId: ID; formType: AnyElementTypes['COLLECTION'] } & Omit<R, 'formType'>>
>;

type GetCollectionEvents<ID extends string, R> = CollectionEvents<ElementInstance<any>, GetCollectionInstance<ID, R>>;

export function defineCollection<const ID extends string, const R extends CollectionInput>(
  schema: { formId: ID } & R & {
      on?: FunctionEventStructure<GetCollectionEvents<ID, R>>;
      once?: FunctionEventStructure<GetCollectionEvents<ID, R>>;
    } & ThisType<GetCollectionInstance<ID, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['COLLECTION'] } & R>>;

export function defineCollection<const ID extends string, const R extends CollectionInput>(
  schema: { formId: ID } & R & {
      on?: ArrayEventStructure<GetCollectionEvents<ID, R>>;
      once?: ArrayEventStructure<GetCollectionEvents<ID, R>>;
    } & ThisType<GetCollectionInstance<ID, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['COLLECTION'] } & R>>;

export function defineCollection<const ID extends string, const R extends CollectionInput>(
  schema: { formId: ID } & R & {
      on?: MixedEventStructure<GetCollectionEvents<ID, R>>;
      once?: MixedEventStructure<GetCollectionEvents<ID, R>>;
    } & ThisType<GetCollectionInstance<ID, R>>
): Simplify<Readonly<{ formId: ID; formType: AnyElementTypes['COLLECTION'] } & R>>;

export function defineCollection(schema: any) {
  return { ...schema, formType: ELEMENT_TYPES.COLLECTION };
}

export function defineSchema<const F extends AnySchema | ValidationRuleSchema>(schema: F): F {
  return schema;
}

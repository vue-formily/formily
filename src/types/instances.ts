import {
  AnySchema,
  ElementOptions,
  FieldType,
  FieldValue,
  GroupSchema,
  CollectionSchema,
  ContainerAddElementOptions,
  ElementConfig,
  FieldConfig,
  ContainerConfig,
  GroupConfig,
  CollectionConfig,
  GroupRaw,
  CollectionRaw,
  FieldRaw,
  GroupValue,
  CollectionValue,
  CollectionElementSchema,
  CollectionAddGroupOptions,
  FormConfig,
  AnyConfigs,
  AnyElementTypes,
  InferFieldValue
} from './elements';
import { UnionToIntersection } from './generic';
import {
  CollectionEvents,
  ContainerEvents,
  ContainerEventsDetail,
  ElementEvents,
  EventPayload,
  FieldEvents,
  GroupEvents,
  RuleConfig,
  RuleEvents,
  RuleMessage,
  RuleSchema,
  SchemyConfig,
  SchemyEvents,
  SchemyProps,
  ValidationAddRuleOptions,
  ValidationConfig,
  ValidationEvents,
  ValidationEventsDetail,
  ValidationRuleSchema,
  ValidationSchema,
  Validator
} from '.';
import { HookMgr } from '../core/HookMgr';
import { Echo } from '../core/Echo';

type WithoutEvents<T> = Omit<T, keyof Echo<any>>;

export type SchemyInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends SchemyConfig = SchemyConfig
> = Echo<SchemyEvents<SchemyInstance<S, C>, SchemyInstance<S, C>>> & {
  readonly config: C;
  readonly rawConfig: C;
  readonly defaultConfig: SchemyConfig;
  readonly schema: S;
  readonly rawSchema: S;
  readonly props: SchemyProps;
  readonly data: Record<PropertyKey, any>;
  hook: HookMgr;
  uid: string;
  setProps(props: SchemyProps): void;
  removeProps(keys: string | string[] | Array<string | string[]>): void;
  throw(message: string, meta?: Record<string, any>): void;
  emit(typeOrEvent: string | EventPayload, detail?: Record<string, any>, ...args: any[]): Echo;
};

export type RuleInstance<S extends RuleSchema = RuleSchema, C extends RuleConfig = RuleConfig> = WithoutEvents<
  SchemyInstance<S, C>
> &
  Echo<RuleEvents<RuleInstance<S, C>, RuleInstance<S, C>>> & {
    readonly name: string;
    readonly pending: boolean;
    readonly message?: string;
    readonly validator: Validator;
    readonly context?: C['context'];
    readonly valid: boolean;
    readonly error: string | null;
    readonly schema: S;
    getSchema(): RuleSchema;
    reset(): void;
    setMessage(message: RuleMessage): void;
    validate(value: any, props?: Record<string, any> | undefined, ...args: any[]): Promise<boolean>;
  };

export type ValidationInstance<
  S extends ValidationSchema = ValidationSchema,
  C extends ValidationConfig = ValidationConfig
> = WithoutEvents<SchemyInstance<S, C>> &
  Echo<
    ValidationEvents<ValidationInstance<S, C>, ValidationInstance<S, C>, ValidationEventsDetail<{ rule: RuleInstance }>>
  > & {
    readonly pending: boolean;
    readonly rules: RuleInstance[];
    readonly valid: boolean;
    readonly errors: string[];
    readonly context?: C['context'];
    getSchema(): ValidationSchema;
    addRule(schema: ValidationRuleSchema, options?: ValidationAddRuleOptions): RuleInstance;
    removeRule(remove: RuleInstance | string | number): RuleInstance;
    reset(): void;
    validate(value: any, ...args: any[]): Promise<boolean>;
  };

export type ElementInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends ElementConfig = ElementConfig
> = WithoutEvents<SchemyInstance<S, C>> &
  Echo<ElementEvents<ElementInstance<S, C>, ElementInstance<S, C>>> & {
    readonly defaultConfig: ElementConfig;
    readonly parent?: C['parent'];
    readonly ancestors: ElementInstance[];
    readonly model: 'model' extends keyof S ? NonNullable<S['model']> : S['formId'];
    readonly formType: S['formType'];
    readonly data: Record<string, any>;
    readonly props: S['props'] & SchemyProps;
    readonly shaken: boolean;
    readonly pending: boolean;
    readonly options: ElementOptions;
    readonly validation: ValidationInstance;
    readonly error: string | null;
    readonly formId: S['formId'];
    readonly htmlName: string;
    readonly valid: boolean;
    readonly raw: unknown;
    readonly prevRaw: unknown;
    readonly prevValue: unknown;
    readonly dirty: boolean;
    getHtmlName(): string;
    shake(): void;
    cleanUp(): void;
    getSchema(): S;
    invalidate(message?: string | undefined): void;
    setInitial(value: any): void;
  };

export type CustomValidationProperty<R> =
  R extends Record<string, any>
    ? {
        [key in R['name']]: RuleInstance;
      }
    : never;

export type CustomVariationProperties<R> = UnionToIntersection<
  CustomValidationProperty<R extends any[] ? R[number] : R>
> &
  ValidationInstance & {
    [key: string]: RuleInstance;
  };

export type InstanceFromSchema<
  S extends Record<string, any>,
  C extends AnyConfigs = S['formType'] extends 'group'
    ? GroupConfig
    : S['formType'] extends 'collection'
      ? CollectionConfig
      : S['formType'] extends 'field'
        ? FieldConfig
        : never,
  V = undefined
> = S['formType'] extends AnyElementTypes['GROUP']
  ? GroupInstance<S & Omit<GroupSchema<any>, 'fields'>, Extract<C, GroupConfig>, V extends undefined ? GroupValue : V>
  : S['formType'] extends AnyElementTypes['COLLECTION']
    ? CollectionInstance<
        S & Omit<CollectionSchema<any>, 'group'>,
        Extract<C, CollectionConfig>,
        V extends undefined ? CollectionValue : V
      >
    : S['formType'] extends AnyElementTypes['FIELD']
      ? FieldInstance<S, C, V extends undefined ? InferFieldValue<S['type']> : V>
      : never;

// type InstancesFromSchemas<S extends AnySchema[], C extends AnyConfigs = {}> = {
//   [K in keyof S]: S[K] extends Record<string, any> ? InstanceFromSchema<S[K], C> : never;
// };

// export type CustomGroupProperty<F, R> = F extends Record<string, any>
//   ? {
//       [key in `$${F['formId']}`]: F['fields'] extends Readonly<unknown[]>
//         ? GroupInstance<F, R>
//         : F['group'] extends Readonly<Record<string, unknown>>
//         ? CollectionInstance<F, R>
//         : F extends FieldSchema
//         ? FieldInstance<F, R>
//         : never;
//     }
//   : never;

// export type CustomGroupProperty<S extends AnySchema, C extends AnyConfigs> = S['formId'] extends string
//   ? { [K in `$${S['formId'] extends infer ID extends string ? ID : ''}`]: InstanceFromSchema<S, C> }
//   : {};
// export type CustomGroupProperty<S extends Record<string, any>, C extends AnyConfigs> = S['formId'] extends string
//   ? { [K in `$${S['formId']}`]: InstanceFromSchema<S, C> }
//   : never;

// export type CustomGroupProperties<S extends Record<string, any>, C extends GroupConfig> = UnionToIntersection<
//   CustomGroupProperty<S['fields'][number], C>
// >;
export type CustomGroupProperties<S extends Record<string, any>, C extends AnyConfigs, V = any> = {
  [F in S['fields'][number] as `$${F['formId']}`]: InstanceFromSchema<
    F,
    C,
    V extends Record<string, any> ? (F['formId'] extends keyof V ? V[F['formId']] : undefined) : undefined
  >;
};

export type FieldInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends FieldConfig = FieldConfig,
  V = FieldValue
> = WithoutEvents<ElementInstance<S, C>> &
  Echo<FieldEvents<FieldInstance<S, C>, FieldInstance<S, C>>> & {
    validation: CustomVariationProperties<S['rules']>;
    checkedValue: string;
    raw: FieldRaw;
    value: V;
    readonly type: FieldType;
    readonly formType: AnyElementTypes['FIELD'];
    readonly default: any;
    readonly checked: any;
    readonly dirty: boolean;
    readonly defaultConfig: FieldConfig;
    setRaw(value: any): Promise<void>;
    setValue(value: any, options?: { asInitial?: boolean }): Promise<any>;
    cast(value: any): FieldValue;
    setCheckedValue(checkedValue: string): void;
    reset(): Promise<void>;
    clear(): Promise<void>;
    setInitial(value: FieldValue): void;
    validate(): Promise<boolean>;
  };

export type ContainerInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends ContainerConfig = ContainerConfig
> = WithoutEvents<ElementInstance<S, C>> &
  Echo<ContainerEvents> & {
    elements: ElementInstance[];
    readonly dirty: boolean;
    shake(options?: { cascade?: boolean }): void;
    reset(): Promise<void>;
    clear(): Promise<void>;
    addElement<T extends ElementInstance>(element: T, options?: ContainerAddElementOptions): Promise<T>;
    removeElement<T extends ElementInstance>(element: T): Promise<T | undefined>;
    validate(options?: { cascade?: boolean }): Promise<boolean>;
  };

export type GroupInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends GroupConfig = GroupConfig,
  V = GroupValue
> = WithoutEvents<ContainerInstance<S, C>> &
  Echo<GroupEvents<ElementInstance<S, C>, GroupInstance<S, C>, ContainerEventsDetail<ElementInstance>>> & {
    validation: CustomVariationProperties<S['rules']>;
    fields: ElementInstance[];
    raw: GroupRaw;
    readonly value: V;
    readonly formType: AnyElementTypes['GROUP'];
    readonly defaultConfig: GroupConfig;
    setValue(obj: Record<string, any>, options?: { asInitial?: boolean }): Promise<Record<string, any> | null>;
    addField<const FS extends AnySchema>(
      schema: FS,
      options?: {
        at?: number;
      }
    ): Promise<InstanceFromSchema<FS, C & { parent: GroupInstance<S, C> }>>;
    removeField(elementOrId: Record<string, any> | string): Promise<Element | null>;
  } & CustomGroupProperties<S, C & { parent: GroupInstance<S, C> }, V>;

export type FormInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends FormConfig = FormConfig,
  V = GroupValue
> = GroupInstance<S, C, V>;

export type CollectionInstance<
  S extends Record<string, any> = Record<string, any>,
  C extends CollectionConfig = CollectionConfig,
  V = CollectionValue
> = WithoutEvents<ContainerInstance<S, C>> &
  Echo<
    CollectionEvents<
      ElementInstance<S, C>,
      CollectionInstance<S, C>,
      ContainerEventsDetail<CollectionElementInstance<S['group'], GroupConfig, V extends any[] ? V[number] : any>>
    >
  > & {
    groups: Array<CollectionElementInstance<S['group'], GroupConfig, V extends any[] ? V[number] : any>>;
    validation: CustomVariationProperties<S['rules']>;
    raw: CollectionRaw;
    value: V;
    readonly schema: S;
    readonly formType: AnyElementTypes['COLLECTION'];
    readonly defaultConfig: CollectionConfig;
    setValue(
      value: any[],
      options?: {
        from?: number;
        autoAdd?: boolean;
        asInitial?: boolean;
      }
    ): Promise<any[]>;
    shake(options?: { cascade?: boolean }): void;
    reset(): Promise<void>;
    clear(): Promise<void>;
    addGroup<T extends CollectionElementInstance<S['group'], GroupConfig, V extends any[] ? V[number] : any>>(
      options?: CollectionAddGroupOptions
    ): Promise<T>;
    removeGroup<T extends CollectionElementInstance<S['group'], GroupConfig, V extends any[] ? V[number] : any>>(
      target: T | number
    ): Promise<T | undefined>;
    validate(options?: { cascade?: boolean }): Promise<boolean>;
    getSchema(): CollectionSchema;
  };

export type CollectionElementInstance<
  S extends CollectionElementSchema = CollectionElementSchema,
  C extends GroupConfig = GroupConfig,
  V = GroupValue
> = GroupInstance<
  S & {
    formType: AnyElementTypes['GROUP'];
    formId: string;
  },
  C,
  V
> & {
  readonly index: number;
};

// export type CollectionElementInstance<T extends Record<string, any> = Readonly<Record<string, any>>> =
//   T['group'] extends Readonly<Record<string, unknown>>
//     ? CustomGroupProperties<T['group']> & {
//         readonly index: number;
//       } & GroupInstance
//     : Exclude<T['groups'], null> extends any[]
//     ? Exclude<T['groups'], null>[number]
//     : never;

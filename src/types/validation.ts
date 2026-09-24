import { ElementInstance, ValidationInstance } from './instances';
import { SchemyConfig, SchemyInternalData, SchemyReactiveData, SchemySchema } from './schemy';

export type ValidationInternalData<
  S extends ValidationSchema = ValidationSchema,
  C extends ValidationConfig = ValidationConfig
> = SchemyInternalData<S, C>;
export type ValidationReactiveData = SchemyReactiveData;

export type ValidatorProps = Record<PropertyKey, any>;

export type Validator = (value: any, props?: ValidatorProps) => string | boolean | Promise<string | boolean>;

export type RuleMessage = string;

export type RuleSchema = SchemySchema & {
  validator: Validator;
  name: string;
  message?: RuleMessage;
};

export type RuleConfig = SchemyConfig & {
  context?: ValidationInstance;
};

export type RuleInternalData<S extends RuleSchema = RuleSchema, C extends RuleConfig = RuleConfig> = SchemyInternalData<
  S,
  C
> & {
  schema: RuleSchema;
};

export type RuleReactiveData = SchemyReactiveData & {
  valid: boolean;
  pending: boolean;
  message?: string;
  tmpMessage: string;
};

export type ValidationRuleSchema = RuleSchema & {
  for?: string[];
};

export type ValidationAddRuleOptions = {
  at?: number;
};

export type ValidationSchema = SchemySchema & {
  rules?: ValidationRuleSchema[];
};

export type ValidationScopes = {
  rule?: RuleConfig;
};
export type ValidationConfig<C extends ElementInstance = ElementInstance> = SchemyConfig & {
  context?: C;
} & ValidationScopes;

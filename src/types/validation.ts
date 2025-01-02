import { ValidationInstance } from './instances';

export type RuleData = {
  r: {
    error: string | null;
    valid: boolean;
    pending: boolean;
  };
  schema: Validator | RuleSchema;
  name: string | number;
  container: ValidationInstance | null;
};

export type InternalValidationRuleSchema = Validator | RuleSchema;

export type ValidationData = {
  context: Record<string, any> | null;
};

export type Validator = (
  value: any,
  props?: Record<string, any>,
  ...args: any[]
) => string | boolean | Promise<string | boolean>;

export interface RuleSchema<N = string | number> {
  validator: Validator;
  name?: N;
  message?: string | ((...args: any[]) => string);
}

export type ValidationRuleSchema<N = string> =
  | Validator
  | (RuleSchema<N> & {
      for?: string[];
      cascade?: boolean;
      inherit?: boolean;
    });

export type Validator = (
  value: any,
  props?: Record<string, any>,
  ...args: any[]
) => string | boolean | Promise<string | boolean>;

export interface RuleSchema {
  validator?: Validator;
  name?: string;
  message?: string;
}

export interface ValidationOptions {
  bails?: boolean;
}

export type ValidationRuleSchema =
  | Validator
  | (RuleSchema & {
      for?: string[];
      cascade?: boolean;
      inherit?: boolean;
    });

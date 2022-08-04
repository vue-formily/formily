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

import { ValidationRuleSchema } from './core/validations/types';

export type SchemaValidation = {
  valid: boolean;
  reason?: string;
  infos?: Record<string, string>;
};

export interface VueFormilyOptions {
  rules?: ValidationRuleSchema[];
  alias?: string;
  elements?: any[];
}

export interface VueFormilyPlugin {
  install(...args: any[]): any;
  [key: string]: any;
}

export type Localizer = (value: string, props?: Record<string, any>, data?: Record<string, any>) => string;

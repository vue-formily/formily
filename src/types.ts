import type { Form } from './core/elements';
import { ValidationRuleSchema } from './core/validations/types';
import type Formily from './Formily';

export type SchemaValidation = {
  valid: boolean;
  reason?: string;
  infos?: Record<string, string>;
};

export interface VueFormilyOptions {
  rules?: ValidationRuleSchema[];
  alias?: string;
  plugins?: VueFormilyPlugin[];
  elements?: any[];
}

export interface VueFormilyPlugin {
  name: string;
  install(...args: any[]): any;
  options?: Record<string, any>;
  [key: string]: any;
}

export type Localizer = (value: string, props?: Record<string, any>, data?: Record<string, any>) => string;

declare module 'vue/types/vue' {
  interface Vue {
    readonly $formily: Formily;
    forms: Record<string, Form>;
  }
}

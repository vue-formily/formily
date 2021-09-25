import { merge } from '@vue-formily/util';
import { ElementOptions, FormSchema, ReadonlySchema } from './core/elements/types';
import { ValidationRuleSchema } from './core/validations/types';
import Form from './core/elements/Form';
import { FormInstance } from './core/elements/instanceTypes';

const defaultOptions: VueFormilyOptions = {
  alias: 'forms'
};

export type VueFormilyOptions = ElementOptions & {
  rules?: ValidationRuleSchema[];
  alias?: string;
};

export default class Formily {
  options: VueFormilyOptions;
  $root: any;

  constructor(options: VueFormilyOptions = {}, $root: any) {
    this.options = merge({}, defaultOptions, options) as VueFormilyOptions;
    this.$root = $root;
  }

  addForm<F extends ReadonlySchema<FormSchema>>(schema: F) {
    const { options } = this;
    const { rules } = schema;

    (schema as any).rules = merge([], options.rules, rules);

    const form = (new Form((schema as unknown) as FormSchema) as unknown) as FormInstance<F>;

    this.$root[options.alias as string][form.formId] = form;

    return form;
  }

  removeForm(formId: string) {
    delete this.$root[this.options.alias as string][formId];
  }

  getForm<F>(formId: string): F {
    return this.$root[this.options.alias as string][formId];
  }
}

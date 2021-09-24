import { merge } from '@vue-formily/util';
import { FormSchema } from './core/elements/types';
import { ReadonlySchema, VueFormilyConfig, VueFormilyOptions } from './types';
import Form from './core/elements/Form';

const defaultOptions: VueFormilyOptions = {
  alias: 'forms'
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

    const form = Form.create<F>(schema);

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

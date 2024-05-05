import { merge } from '@vue-formily/util';
import { ElementOptions, FormSchema, ReadonlySchema } from './core/elements/types';
import { ValidationRuleSchema } from './core/validations/types';
import Form from './core/elements/Form';
import { FormInstance } from './core/elements/instanceTypes';
import Evento from './core/Evento';
import { reactive } from 'vue';

export type VueFormilyOptions = ElementOptions & {
  rules?: ValidationRuleSchema[];
  alias: string;
};

export type VueFormilyOptionsParam = ElementOptions & Partial<VueFormilyOptions>;

const defaultOptions: VueFormilyOptions = {
  alias: 'forms'
};

export default class Formily extends Evento {
  options: VueFormilyOptions;

  forms: Record<string, FormInstance> = reactive({});

  constructor(options: VueFormilyOptionsParam = {}) {
    super();

    this.options = merge({}, defaultOptions, options) as VueFormilyOptions;
  }

  addForm<F extends ReadonlySchema<FormSchema>>(schema: F) {
    const { options } = this;
    const { rules } = schema;

    (schema as any).rules = merge([], options.rules, rules);

    const form = new Form(schema as unknown as FormSchema) as unknown as FormInstance<F>;

    this.forms[form.formId] = form as FormInstance;

    this.emit('addForm', form);

    return form;
  }

  removeForm(formId: string) {
    const removed = this.forms[formId];

    delete this.forms[formId];

    this.emit('removeForm', removed);
  }

  getForm<F>(formId: string): F {
    return this.forms[formId] as F;
  }
}

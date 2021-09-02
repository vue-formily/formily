import { merge } from '@vue-formily/util';
import { FormSchema } from './core/elements/types';
import { VueFormilyOptions } from './types';
import Form from './core/elements/Form';

const defaultOptions: VueFormilyOptions = {
  alias: 'forms'
};

export default class Formily {
  options: VueFormilyOptions;
  vm: any;

  constructor(options: VueFormilyOptions = {}, vm: any) {
    this.options = merge({}, defaultOptions, options) as VueFormilyOptions;
    this.vm = vm;
  }

  addForm(schema: FormSchema) {
    const { vm, options } = this;
    const { rules, props = {} } = schema;

    schema.rules = merge([], options.rules, rules);

    props._formy = {
      vm: () => this.vm
    };

    schema.props = props;

    const form = new Form(schema);

    vm.$set(vm[options.alias as string], form.formId, form);

    return form;
  }

  removeForm(formId: string) {
    delete this.vm[this.options.alias as string][formId];
  }
}

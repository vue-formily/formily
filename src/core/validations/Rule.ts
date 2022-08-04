import { isFunction, isPlainObject, isString, merge } from '@vue-formily/util';
import { RuleSchema, Validator } from './types';

import Objeto from '../Objeto';
import { ValidationInstance } from '../elements/instanceTypes';

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

export default class Rule extends Objeto {
  protected _d!: RuleData;
  message?: string | ((...args: any[]) => string);
  validator!: Validator;

  constructor(rule: Rule | RuleSchema | Validator, container: ValidationInstance | null = null) {
    super();

    const data = this._d;
    const { r } = data;

    data.name = rule.name || Date.now();
    data.container = container;
    data.schema = rule instanceof Rule ? rule.getSchema() : rule;

    r.pending = false;
    r.error = null;
    r.valid = true;

    if (isFunction(rule)) {
      this.validator = rule;
    } else if (isPlainObject(rule)) {
      this.validator = rule.validator;
      this.message = rule.message;
    }
  }

  get name() {
    return this._d.name;
  }

  get container() {
    return this._d.container;
  }

  get context(): Record<string, any> | null {
    return this.container ? this.container.context : null;
  }

  get valid() {
    return this._d.r.valid;
  }

  get error() {
    return this._d.r.error;
  }

  get pending() {
    return this._d.r.pending;
  }

  getSchema() {
    return this._d.schema;
  }

  reset() {
    this._d.r.error = null;
    this._d.r.valid = true;
  }

  async validate(value: any, props?: Record<string, any>, ...args: any[]): Promise<Rule> {
    this._d.r.pending = true;

    this.emit('validate', this);

    const { r } = this._d;

    let error: string | null = null;
    let valid = true;
    let result: string | boolean = true;
    const context = this.context || {};

    if (isFunction(this.validator)) {
      result = await this.validator(value, merge({}, context.props, props), ...args);

      if (result === false) {
        error = isFunction(this.message) ? this.message(...args) : this.format(this.message, 'string', ...args);
        valid = false;
      } else if (isString(result)) {
        error = result;
        valid = false;
      }
    }

    r.error = error;
    r.valid = valid;
    r.pending = false;

    this.emit('validated', this);

    return this;
  }
}

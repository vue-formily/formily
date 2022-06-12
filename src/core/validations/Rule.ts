import { isFunction, isPlainObject, isString } from '@vue-formily/util';
import { RuleSchema, Validator } from './types';

import { dumpProp, readonlyDumpProp } from '../../utils';
import Objeto from '../Objeto';
import { ValidationInstance } from '../elements/instanceTypes';

export type RuleData = {
  error: string | null;
  valid: boolean;
  pending: boolean;
  container: ValidationInstance | null;
};

function isRule(input: Rule | RuleSchema | Validator): input is Rule {
  return input instanceof Rule;
}

export default class Rule extends Objeto {
  readonly name!: string;
  readonly schema!: RuleSchema | Validator;
  protected _d!: RuleData;
  message!: string | null;
  validator?: Validator | null;

  constructor(rule: Rule | RuleSchema | Validator, container: ValidationInstance | null = null) {
    super();

    const _d = this._d;

    readonlyDumpProp(this, 'schema', isRule(rule) ? rule.getSchema() : rule);
    readonlyDumpProp(this, 'name', rule.name || Date.now());

    dumpProp(this, 'message', null);

    _d.container = container;
    _d.pending = false;
    _d.error = null;
    _d.valid = true;

    if (isFunction(rule)) {
      this.validator = rule;
    } else if (isPlainObject(rule)) {
      this.validator = rule.validator;

      this.setMessage(rule.message as string);
    }
  }

  get container() {
    return this._d.container;
  }

  get context(): Record<string, any> | null {
    return this.container ? this.container.context : null;
  }

  get valid() {
    return this._d.valid;
  }

  get error() {
    return this._d.error;
  }

  get pending() {
    return this._d.pending;
  }

  getSchema(): RuleSchema | Validator {
    return this.schema;
  }

  setMessage(message: string | null = null) {
    this.message = message;
  }

  reset() {
    this._d.error = null;
    this._d.valid = true;
  }

  async validate(value: any, props?: Record<string, any>, ...args: any[]): Promise<Rule> {
    this._d.pending = true;

    this.emit('validate', this);

    const { _d: data } = this;

    let error: string | null = null;
    let valid = true;
    let result: string | boolean = true;
    const _props = props || (this.context && this.context.props) || {};

    if (isFunction(this.validator)) {
      result = await this.validator(value, _props, ...args);

      if (result === false || isString(result)) {
        error = result || this.format(this.message, 'string', ...args);
        valid = false;
      }
    }

    data.error = error;
    data.valid = valid;

    this._d.pending = false;

    this.emit('validated', this);

    return this;
  }
}

import { isFunction, isPlainObject, isString } from '@vue-formily/util';
import { RuleSchema, Validator } from './types';

import { dumpProp, readonlyDumpProp } from '../../utils';
import Objeto from '../Objeto';
import { ValidationInstance } from '../elements/instanceTypes';

export type RuleData = {
  error: string | null;
  valid: boolean;
  schema: RuleSchema | Validator;
  container: ValidationInstance | null;
};

function isRule(input: Rule | RuleSchema | Validator): input is Rule {
  return input instanceof Rule;
}

export default class Rule extends Objeto {
  readonly name!: string;
  protected _d!: RuleData;
  message!: string | null;
  validator?: Validator | null;

  constructor(rule: Rule | RuleSchema | Validator, container: ValidationInstance | null = null) {
    super();

    const _d = this._d;

    _d.container = container;

    readonlyDumpProp(_d, 'schema', isRule(rule) ? rule.getSchema() : rule);
    readonlyDumpProp(this, 'name', rule.name || Date.now());

    dumpProp(this, 'message', null);

    _d.error = null;
    _d.valid = true;

    if (isFunction(rule)) {
      this.validator = rule;
    } else if (isPlainObject(rule)) {
      this.validator = rule.validator;

      this.setMessage(rule.message as string);
    }
  }

  get context(): Record<string, any> | null {
    return this.container ? this.container.context : null;
  }

  get container() {
    return this._d.container;
  }

  get valid() {
    return this._d.valid;
  }

  get error() {
    return this._d.error;
  }

  get schema() {
    return this.getSchema();
  }

  getSchema(): RuleSchema | Validator {
    return this._d.schema;
  }

  setMessage(message: string | null = null) {
    this.message = message;
  }

  reset() {
    this._d.error = null;
    this._d.valid = true;
  }

  async validate(value: any, props?: Record<string, any>, ...args: any[]): Promise<Rule> {
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

    this.emit('validated', this);

    return this;
  }
}

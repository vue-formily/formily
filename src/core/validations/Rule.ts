import { isFunction, isPlainObject, isString } from '@vue-formily/util';
import { RuleSchema, Validator } from './types';

import { dumpProp, readonlyDumpProp } from '../../utils';
import Objeto from '../Objeto';

type RuleData = {
  error: string | null;
  valid: boolean;
};

export default class Rule extends Objeto {
  readonly name!: string;
  protected _d!: RuleData;
  message!: string | null;
  validator?: Validator | null;

  constructor(rule: Rule | RuleSchema | Validator) {
    super();

    readonlyDumpProp(this, 'name', rule.name || Date.now());

    dumpProp(this, 'message', null);

    const data = this._d;

    data.error = null;
    data.valid = true;

    if (isFunction(rule)) {
      this.validator = rule;
    } else if (isPlainObject(rule)) {
      this.validator = rule.validator;

      this.setMessage(rule.message as string);
    }
  }

  get valid() {
    return this._d.valid;
  }

  get error() {
    return this._d.error;
  }

  setMessage(message: string | null = null) {
    this.message = message;
  }

  reset() {
    this._d.error = null;
    this._d.valid = true;
  }

  async validate(value: any, props: Record<string, any> = {}, ...args: any[]): Promise<Rule> {
    const { _d: data, plugs = {} } = this;
    const translater = (plugs as any).i18n;

    let error = null;
    let valid = true;
    let result: string | boolean = true;

    if (isFunction(this.validator)) {
      result = await this.validator(value, props, ...args);
    }

    this.emit('validate', this);

    if (result === false || isString(result)) {
      error = result || this.message;
      valid = false;
    }

    data.error = translater && isString(error) ? translater.translate(error, ...args) : error;
    data.valid = valid;

    this.emit('validated', this);

    return this;
  }
}

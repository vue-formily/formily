import { isString } from '@vue-formily/util';

import {
  ConfigParam,
  RuleConfig,
  RuleHook,
  RuleInternalData,
  RuleMessage,
  RuleReactiveData,
  RuleSchema
} from '@/types';
import { Schemy } from '@/core/Schemy';
import { RULE_HOOKS } from '@/hooks/rule';
import { mergeConfigs } from '@/helpers';

const defaultValidator = () => true;

export class Rule<
  S extends RuleSchema = RuleSchema,
  C extends RuleConfig = RuleConfig,
  I extends RuleInternalData<S, C> = RuleInternalData<S, C>,
  R extends RuleReactiveData = RuleReactiveData
> extends Schemy<S, C, I, R> {
  constructor(schema: S, config?: ConfigParam<RuleConfig>) {
    super(schema, config);

    this.reset();
  }

  get defaultConfig(): RuleConfig {
    return mergeConfigs([
      super.defaultConfig,
      {
        hooks: RULE_HOOKS
      }
    ]);
  }

  get name() {
    return this.schema.name;
  }

  get context() {
    return (this.config as RuleConfig).context;
  }

  get validator() {
    return (this.schema as RuleSchema).validator || defaultValidator;
  }

  get message() {
    return this.hook.roll<RuleHook, 'rule.message'>('rule.message', {
      value: this._r.get('tmpMessage') || this._r.get('message')
    });
  }

  get valid() {
    return this._r.get('valid');
  }

  get error() {
    return this.valid ? null : this.message;
  }

  get pending() {
    return this._r.get('pending');
  }

  reset() {
    this._r.patch({
      valid: true,
      pending: false,
      tmpMessage: undefined
    } as Partial<R>);

    this.setMessage(this.schema.message);
  }

  setMessage(message?: RuleMessage) {
    this._r.set('message', message);
  }

  async validate(value: any, props?: Record<string, any>): Promise<boolean> {
    this._r.set('pending', true);

    this.emit('validate', { value });

    const validatorProps = this.hook.roll<RuleHook, 'rule.validatorProps'>('rule.validatorProps', {
      value: props
    });

    const result = await this.validator(value, validatorProps);
    const isMessage = isString(result);
    const valid = result === false ? false : !isMessage;
    const tmpMessage = isMessage ? result : '';

    this._r.patch({
      valid,
      pending: false,
      tmpMessage
    } as Partial<R>);

    this.emit('validated', { value });

    return this.valid;
  }
}

import { isString } from '@vue-formily/util';

import {
  ConfigParam,
  ValidationConfig,
  ValidationAddRuleOptions,
  ValidationInstance,
  ValidationRuleSchema,
  ValidationSchema,
  ValidationInternalData,
  ValidationReactiveData
} from '@/types';

import { Rule } from './Rule';
import { Schemy } from '@/core/Schemy';
import { VALIDATION_HOOKS } from '@/hooks/validation';
import { addItem, removeItem } from '@/utils';
import { mergeConfigs } from '@/helpers';

export class Validation<
  S extends ValidationSchema = ValidationSchema,
  C extends ValidationConfig = ValidationConfig,
  I extends ValidationInternalData<S, C> = ValidationInternalData<S, C>,
  R extends ValidationReactiveData = ValidationReactiveData
> extends Schemy<S, C, I, R> {
  rules: Rule[] = [];

  constructor(schema: S = {} as S, config?: ConfigParam<ValidationConfig>) {
    super(schema, config);

    const { rules = [] } = schema;

    rules.forEach(rule => this.addRule(rule));
  }

  get defaultConfig(): ValidationConfig {
    return mergeConfigs([
      super.defaultConfig,
      {
        hooks: VALIDATION_HOOKS
      }
    ]);
  }

  get context() {
    return (this.config as ValidationConfig).context;
  }

  get pending() {
    return this.rules.length > 0 && this.rules.some(rule => rule.pending);
  }

  get valid() {
    return !this.rules.some(rule => !rule.valid);
  }

  get errors() {
    return this.rules.map(rule => rule.error).filter(error => error);
  }

  addRule(schema: ValidationRuleSchema, options: ValidationAddRuleOptions = {}): Rule {
    const { reactor, plugs, rule: ruleConfig } = this.config;
    const rule = new Rule(schema, [
      {
        reactor,
        plugs,
        context: this as unknown as ValidationInstance
      },
      ruleConfig
    ]);
    const name = rule.name;

    if (name in this) {
      this.throw(__DEV__ ? `Duplicated rule: ${name}` : '3');
    }

    addItem(this.rules, rule, options);

    (this as any)[name] = rule;

    this.emit('ruleAdded', { rule });

    return rule;
  }

  removeRule(remove: Rule | string | number) {
    const target = isString(remove) ? this[remove as keyof this] : remove instanceof Rule ? remove : this.rules[remove];
    const rule = removeItem(this.rules, target, { key: 'name' });

    if (rule) {
      delete this[rule.name as keyof Validation];

      this.emit('ruleRemoved', { rule });
    }

    return rule;
  }

  reset() {
    this.rules.forEach(rule => rule.reset());
  }

  async validate(value: any, ...args: any[]): Promise<boolean> {
    this.emit('validate', { value });

    await Promise.all(this.rules.map(async rule => await rule.validate(value, ...args)));

    this.emit('validated', { value });

    return this.valid;
  }
}

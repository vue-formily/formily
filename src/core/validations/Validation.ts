import { findIndex, isNumber } from '@vue-formily/util';
import { RuleSchema, Validator } from './types';
import Rule from './Rule';
import Objeto from '../Objeto';
import { isUndefined, throwFormilyError } from '@/utils';

type InternalValidationRuleSchema = Validator | RuleSchema;

export default class Validation extends Objeto {
  rules: Rule[] = [];

  constructor(rules: InternalValidationRuleSchema[] = []) {
    super();

    rules.forEach(rule => this.addRule(rule));
  }

  get valid() {
    return !this.rules.some(rule => !rule.valid);
  }

  get errors() {
    if (this.valid) {
      return null;
    }

    const errors = this.rules.map(rule => rule.error).filter(error => error);

    return errors.length ? errors : null;
  }

  get schema() {
    return this.getSchema();
  }

  getSchema() {
    const filtered = this.rules
      .map(rule => {
        const schema = rule.getSchema();

        return (schema as any).__cascaded ? ((schema as any).__origin as RuleSchema | undefined) : schema;
      })
      .filter(schema => !isUndefined(schema));

    return filtered.length ? filtered : null;
  }

  addRule(ruleOrSchema: Rule | InternalValidationRuleSchema, { at }: { at?: number } = {}): Rule {
    const rule = new Rule(ruleOrSchema);
    const name = rule.name;

    if (name in this) {
      throwFormilyError(`Dupplicated rule: ${name}`);
    }

    const index = isNumber(at) ? at : this.rules.length;

    this.rules.splice(index, 0, rule);

    (this as any)[name] = rule;

    return rule;
  }

  removeRule(remove: Rule | string) {
    const index = findIndex(this.rules, ({ name }) => {
      const n = remove instanceof Rule ? remove.name : remove;

      return name === n;
    });

    const [removed] = index !== -1 ? this.rules.splice(index, 1) : [];

    delete this[removed.name as keyof Validation];

    this.emit('add', this, removed);

    return removed;
  }

  reset() {
    this.rules.forEach(rule => rule.reset());
  }

  async validate(
    value: any,
    options: { excluded?: string[]; get?: string[] } = {},
    ...args: any[]
  ): Promise<Validation> {
    const { excluded, get } = options;

    this.emit('validate', this);

    if (this.rules) {
      let rules = get ? this.rules.filter(({ name }) => get.includes(name)) : this.rules;
      rules = excluded ? rules.filter(({ name }) => !excluded.includes(name)) : rules;

      await Promise.all(rules.map(async rule => await rule.validate(value, ...args)));
    }

    this.emit('validated', this);

    return this;
  }
}

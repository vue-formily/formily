import { findIndex, isNumber } from '@vue-formily/util';
import { RuleSchema, Validator } from './types';
import Rule from './Rule';
import Objeto from '../Objeto';

type ValitionRuleSchema = Validator | RuleSchema;

type Options = {
  from?: number;
};

export default class Validation extends Objeto {
  rules: Rule[] = [];

  constructor(rules?: ValitionRuleSchema[]) {
    super();

    if (rules) {
      this.addRules(rules);
    }
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

  addRules(rulesOrSchemas: (Rule | ValitionRuleSchema)[], { from }: Options = {}): Rule[] {
    from = isNumber(from) ? from++ : -Infinity;

    return rulesOrSchemas.map((schema: Rule | ValitionRuleSchema) => {
      return this.addRule(schema, { from: (from as number)++ });
    });
  }

  removeRules(removes: (Rule | string)[]): Rule[] {
    return removes.map(remove => this.removeRule(remove));
  }

  addRule(ruleOrSchema: Rule | ValitionRuleSchema, { from }: Options = {}): Rule {
    const rule = new Rule(ruleOrSchema);
    const currentRule = (this as any)[rule.name];

    if (currentRule) {
      this.removeRule(currentRule);
    }

    const length = this.rules.length;

    this.rules.splice(isNumber(from) && from >= 0 && from <= length ? from : length, 0, rule);

    (this as any)[rule.name] = rule;

    return rule;
  }

  removeRule(remove: Rule | string) {
    const index = findIndex(this.rules, ({ name }) => {
      const n = remove instanceof Rule ? remove.name : remove;

      return name === n;
    });

    const [removed] = index !== -1 ? this.rules.splice(index, 1) : [];

    delete this[removed.name as keyof Validation];

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

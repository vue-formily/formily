import { CustomVariationProperties } from '@/core/elements/instanceTypes';
import { Rule, Validation } from '@/core/validations';
import { numeric, required } from './helpers/rules';

describe('Validation', () => {
  const validation = new Validation();

  it('Can add multiple rules', () => {
    const rules = [numeric, required];

    type V = CustomVariationProperties<typeof rules>;

    validation.addRules(rules);

    expect(validation.rules.length).toBe(2);
    expect((validation as V).numeric).toBeInstanceOf(Rule);
    expect((validation as V).required).toBeInstanceOf(Rule);
  });

  it('Can remove multiple rules', () => {
    const removes = validation.removeRules([new Rule(numeric), 'required']);

    expect(validation.rules.length).toBe(0);
    expect(removes.length).toBe(2);
    expect((validation as any).numeric).toBe(undefined);
    expect((validation as any).required).toBe(undefined);
    expect(removes[0]).toBeInstanceOf(Rule);
    expect(removes[1]).toBeInstanceOf(Rule);
  });

  it('Can add single rule', () => {
    const rule = validation.addRule(numeric);

    expect(rule).toBeInstanceOf(Rule);
    expect(rule.name).toBe('numeric');

    validation.addRule(required);

    expect(validation.rules.length).toBe(2);
    expect(validation.rules[0]).toBeInstanceOf(Rule);
    expect(validation.rules[1]).toBeInstanceOf(Rule);
  });
});

import { Rule, Validation } from '@/core/validations';
import { numeric, required } from './helpers/rules';

describe('Validation', () => {
  const validation = new Validation();

  it('Can add multiple rules', () => {
    validation.addRules([numeric, required]);

    expect(validation.rules.length).toBe(2);
    expect(validation.numeric).toBeInstanceOf(Rule);
    expect(validation.required).toBeInstanceOf(Rule);
  });

  it('Can remove multiple rules', () => {
    const removes = validation.removeRules([new Rule(numeric), 'required']);

    expect(validation.rules.length).toBe(0);
    expect(removes.length).toBe(2);
    expect(validation.numeric).toBe(undefined);
    expect(validation.required).toBe(undefined);
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

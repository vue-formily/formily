import { CustomVariationProperties } from '@/core/elements/instanceTypes';
import { Rule, Validation } from '@/core/validations';
import { numeric, required } from './helpers/rules';

describe('Validation', () => {
  const validation = new Validation();

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

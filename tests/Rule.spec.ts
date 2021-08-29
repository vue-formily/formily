import { Rule } from '@/core/validations';
import { numeric } from './helpers/rules';

describe('Rule', () => {
  const rule = new Rule(numeric);

  it('Instantiate successfully with validator', async () => {
    const rule = new Rule(() => true);

    expect(rule).toBeInstanceOf(Rule);
    expect((await rule.validate('')).error).toBe(null);
  });

  it('Instantiate successfully with rule instance', async () => {
    const r = new Rule(rule);
    expect(r).toBeInstanceOf(Rule);
  });

  it('Validate successfully', async () => {
    expect((await rule.validate(4)).valid).toBe(true);
    expect((await rule.validate('4a')).valid).toBe(false);
  });

  it('Can set message dynamically', async () => {
    expect((await rule.validate('4a')).error).toBe(null);

    rule.message = 'Value is not a number';

    expect((await rule.validate('4a')).error).toBe('Value is not a number');
  });
});

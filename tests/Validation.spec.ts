import { vi } from 'vitest';
import { Rule, Validation } from '@/core/validations';
import { numeric, required } from './helpers/rules';

describe('Validation', () => {
  it('Can add single rule', () => {
    const validation = new Validation();
    const rule = validation.addRule(numeric);

    expect(rule).toBeInstanceOf(Rule);
    expect(rule.name).toBe('numeric');

    validation.addRule(required);

    expect(validation.rules.length).toBe(2);
    expect(validation.rules[0]).toBeInstanceOf(Rule);
    expect(validation.rules[1]).toBeInstanceOf(Rule);
  });

  it('should start as valid and not pending when there are no rules', () => {
    const validation = new Validation();

    expect(validation.valid).toBe(true);
    expect(validation.pending).toBe(false);
    expect(validation.errors).toEqual([]);
  });

  it('should validate and return correct valid state', async () => {
    const validation = new Validation({ rules: [{ ...required, message: 'Required' }] });

    await validation.validate('');
    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(['Required']);

    await validation.validate('hello');
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should collect errors from all failing rules', async () => {
    // Use two custom rules that both fail on the same input
    const validation = new Validation({
      rules: [
        { name: 'minLen', validator: (v: string) => v.length >= 5, message: 'Too short' },
        { name: 'noSpaces', validator: (v: string) => !v.includes(' '), message: 'No spaces' }
      ]
    });

    // 'hi' → too short (< 5) AND no spaces (passes). Use 'a b' → short AND has spaces → both fail
    await validation.validate('a b');
    expect(validation.errors.length).toBe(2);
    expect(validation.errors).toContain('Too short');
    expect(validation.errors).toContain('No spaces');

    // Fix both
    await validation.validate('hello');
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should throw when adding a duplicate rule name', () => {
    const validation = new Validation();
    validation.addRule({ name: 'myRule', validator: () => true });

    expect(() => {
      validation.addRule({ name: 'myRule', validator: () => false });
    }).toThrow();
  });

  it('Can remove rule by name', async () => {
    const validation = new Validation({
      rules: [
        { ...required, message: 'Required' },
        { ...numeric, message: 'Not a number' }
      ]
    });

    validation.removeRule('required');
    expect(validation.rules.length).toBe(1);

    await validation.validate('abc');
    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(['Not a number']);
  });

  it('Can remove rule by index', () => {
    const validation = new Validation({
      rules: [
        { name: 'r1', validator: () => true },
        { name: 'r2', validator: () => true }
      ]
    });

    validation.removeRule(0);
    expect(validation.rules.length).toBe(1);
    expect(validation.rules[0].name).toBe('r2');
  });

  it('should handle async validator correctly', async () => {
    const asyncValidator = vi.fn(async (value: string) => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return value === 'valid';
    });

    const validation = new Validation({
      rules: [{ name: 'async', validator: asyncValidator, message: 'Async failed' }]
    });

    const promise = validation.validate('invalid');
    expect(validation.rules[0].pending).toBe(true);

    await promise;

    expect(asyncValidator).toHaveBeenCalledWith('invalid', expect.any(Object));
    expect(validation.valid).toBe(false);
    expect(validation.pending).toBe(false);
    expect(validation.errors).toEqual(['Async failed']);

    await validation.validate('valid');
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should support validator returning a string as inline error message', async () => {
    const validation = new Validation({
      rules: [
        {
          name: 'custom',
          validator: (value: string) => (value.length < 3 ? 'Too short' : true),
          message: 'Default message'
        }
      ]
    });

    await validation.validate('ab');
    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(['Too short']);

    await validation.validate('abc');
    expect(validation.valid).toBe(true);
  });

  it('should reset all rules to valid state', async () => {
    const validation = new Validation({ rules: [{ ...required, message: 'Required' }] });

    await validation.validate('');
    expect(validation.valid).toBe(false);

    validation.reset();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});

import { vi } from 'vitest';
import { SharedConfig } from '@/types';
import { mergeConfigs } from '@/helpers';

describe('mergeConfigs', () => {
  it('should return an empty object if no configs are provided', () => {
    // @ts-expect-error test
    expect(mergeConfigs()).toEqual({});
  });

  test('should merge basic properties, override simple values, and concatenate arrays', () => {
    const config1 = { options: 1, data: ['a', 'b'], version: 'v1' } as any;
    const config2 = { options: 2, data: ['c'], version: 'v2' } as any;
    const config3 = { data: ['d', 'e'] } as any;

    const result = mergeConfigs([config1, config2, config3]);

    expect(result).toEqual({
      options: 2,
      data: ['a', 'b', 'c', 'd', 'e'],
      version: 'v2',
      hooks: expect.any(Array),
      on: {},
      once: {}
    });
  });

  it('should handle nested arrays of configs', () => {
    const config1 = { on: { click: () => {} } };
    const config2 = { once: { mounted: () => {} } };
    const config3 = { hooks: [{ name: 'test', handlers: {} }] };

    const merged = mergeConfigs([config1, [config2, config3]] as any);

    expect(merged.on).toBeDefined();
    expect(merged.once).toBeDefined();
    expect(merged.hooks).toBeDefined();
    expect(merged.on!.click).toHaveLength(1);
    expect(merged.once!.mounted).toHaveLength(1);
    expect(merged.hooks).toHaveLength(1);
  });

  test('should handle null/undefined configs and return the target if no rest configs exist', () => {
    const config1 = { options: 1, data: ['a'] } as any;

    const result = mergeConfigs([config1, null, undefined]);

    expect(result).toEqual({
      options: 1,
      data: ['a'],
      hooks: expect.any(Array),
      on: {},
      once: {}
    });

    const resultEmpty = mergeConfigs([null, undefined] as any);

    expect(resultEmpty).toEqual({});
  });

  it('should concatenate hooks arrays', () => {
    const hook1 = { name: 'hook1', handlers: {} };
    const hook2 = { name: 'hook2', handlers: {} };
    const config1: SharedConfig = { hooks: [hook1] };
    const config2: SharedConfig = { hooks: [hook2] };

    const merged = mergeConfigs([config1, config2]);

    expect(merged.hooks).toEqual([hook1, hook2]);
  });

  test('should merge "on" and "once" handlers using normalizeHandlers logic', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    const config1 = { on: { submit: handler1 }, once: { load: handler2 } };
    const config2 = { on: { submit: handler3 } };

    const result = mergeConfigs([config1, config2]);

    expect(result.on).toBeDefined();
    expect(result.on!.submit).toHaveLength(2);
    expect(result.on!.submit).toEqual([handler1, handler3]);

    expect(result.once).toBeDefined();
    expect(result.once!.load).toHaveLength(1);
    expect(result.once!.load).toEqual([handler2]);

    const config4 = { on: { change: handler1 } };
    const resultSingle = mergeConfigs(config4);
    expect(resultSingle.on!.change).toHaveLength(1);
    expect(resultSingle.on!.change).toEqual([handler1]);
  });

  it('should correctly merge a complex nested structure', () => {
    const h1 = () => {};
    const h2 = () => {};
    const h3 = () => {};
    const hook1 = { name: 'hook1', handlers: {} };
    const hook2 = { name: 'hook2', handlers: {} };

    const configs = [
      { on: { a: h1 }, hooks: [hook1] },
      undefined,
      [{ on: { a: h2, b: h3 }, once: { c: h1 } }, [{ hooks: [hook2] }]]
    ];

    const merged = mergeConfigs(configs as any);

    expect(merged.on?.a).toEqual([h1, h2]);
    expect(merged.on?.b).toHaveLength(1);
    expect(merged.once?.c).toHaveLength(1);
    expect(merged.once?.c).toContain(h1);
    expect(merged.hooks).toEqual([hook1, hook2]);
  });
});

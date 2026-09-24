import { flatArray } from '@vue-formily/util';
import { ConfigParam, SchemyConfig, GenericEchoEvents, NormalizedEchoEvents, NormalizedConfig } from '@/types';
import { forEach, reduce } from '../utils';

/**
 * Normalizes and merges multiple handler objects (e.g., 'on' or 'once' event handlers).
 * If multiple handlers exist for the same key, they are merged into a flat array.
 *
 * @param allHandlers - An array of handler objects to merge.
 * @returns A single merged handler object where all values are arrays of handlers.
 */
function normalizeHandlers(...allHandlers: GenericEchoEvents[]): NormalizedEchoEvents {
  return reduce(
    allHandlers,
    (handlers, curHandlers) => {
      forEach(curHandlers, (value, key) => {
        // Ensure the handler for 'key' is an array, and append the current value (which might be a single function or an array).
        handlers[key] = flatArray([handlers[key] || [], [value]]);
      });

      return handlers;
    },
    {} as NormalizedEchoEvents
  );
}

/**
 * Merges multiple partial Schemy configurations into a single target configuration.
 *
 * Special merging rules:
 * 1. 'on'/'once' properties (event listeners): Merged deeply using normalizeHandlers.
 * 2. Array properties: Flattened and concatenated.
 * 3. Other properties: Overwritten by the last config's value.
 *
 * @param configs - A single config object or an array of config objects to merge.
 * @param options - Configuration options, including hooks to filter out.
 * @returns The merged configuration object, using the first config as the base target.
 */
export function mergeConfigs<T extends object>(configs: ConfigParam<T>): NormalizedConfig<T> {
  const allConfigs = flatArray([configs]).filter(Boolean) as T[];

  if (allConfigs.length === 0) {
    return {} as NormalizedConfig<T>;
  }

  const [target, ...restConfigs] = allConfigs;
  const allOnHandlers: GenericEchoEvents[] = [];
  const allOnceHandlers: GenericEchoEvents[] = [];
  const {
    on: targetOn = {},
    once: targetOnce = {},
    hooks: targetHooks = [],
    ...restTargetConfig
  } = target as SchemyConfig;

  // Use a temporary accumulator to merge all rest properties first
  const accumulator = restConfigs.reduce((acc: SchemyConfig, config) => {
    const { hooks = [], on, once, ...rest } = config as SchemyConfig;

    // --- Merge Hooks (Concatenate and Filter) ---
    // Safely concatenate the hooks array.
    acc.hooks = flatArray([acc.hooks || [], hooks]);

    // --- Collect Handlers (Defer normalization) ---
    if (on) allOnHandlers.push(on);
    if (once) allOnceHandlers.push(once);

    // --- Merge Remaining Properties ---
    forEach<Partial<SchemyConfig>>(rest, (value, key) => {
      const accValue = (acc as any)[key];

      if (Array.isArray(value)) {
        // Concatenate and flatten arrays.
        (acc as any)[key] = accValue ? flatArray([accValue, value]) : value;
      } else {
        // For all other properties, the last value wins (override).
        (acc as any)[key] = value;
      }
    });

    return acc;
  }, restTargetConfig as SchemyConfig);

  accumulator.hooks = flatArray([targetHooks, accumulator.hooks || []]);
  accumulator.on = normalizeHandlers(targetOn, ...allOnHandlers);
  accumulator.once = normalizeHandlers(targetOnce, ...allOnceHandlers);

  return accumulator as NormalizedConfig<T>;
}

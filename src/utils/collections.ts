import { findIndex, isNumber, isPlainObject, isUndefined } from '@vue-formily/util';

/**
 * Iterates over the properties of an object or elements of an array and executes a callback.
 * (Similar to Array.prototype.forEach, but works for plain objects too.)
 *
 * @template V - The type of the input (array or object).
 * @param input - The array or object to iterate over.
 * @param callback - A function to execute on each element/property.
 * It takes (currentValue, key, input).
 */
export function forEach<V extends Record<string, any> | any[]>(
  input: V,
  callback: (value: V extends any[] ? V[number] : V[keyof V], key: string, input: V) => void
) {
  // Use Object.keys to iterate over all enumerable string properties (including array indices as strings).
  const keys = Object.keys(input as any);

  // The 'forEach' on the keys array is efficient and clear.
  keys.forEach(key => {
    // Cast 'input as any' is used to access properties with string keys,
    // satisfying TypeScript when input is generic/complex object type.
    callback((input as any)[key], key, input);
  });
}

/**
 * Reduces the input (array or object) to a single value by executing a callback function
 * on each element/property and accumulating the result.
 *
 * @template V - The type of the input (array or object).
 * @template R - The type of the accumulated result.
 * @param input - The array or object to iterate over.
 * @param callback - A function to execute on each element/property.
 * It takes (accumulator, currentValue, key, input) and returns the new accumulator value.
 * @param initialValue - The initial value of the accumulator.
 * @returns The final accumulated value.
 */
export function reduce<V extends Record<string, any> | any[], R>(
  input: V,
  callback: (accumulator: R, currentValue: V extends any[] ? V[number] : V[keyof V], key: string, input: V) => R,
  initialValue: R
): R {
  let accumulator = initialValue;

  forEach(input, (value, key) => {
    // Execute the callback and update the accumulator
    accumulator = callback(accumulator, value, key, input);
  });

  return accumulator;
}

export function findItem<I>(
  items: I[],
  reference: any,
  {
    key = 'id'
  }: {
    key?: string;
  } = {}
) {
  const index = findIndex(items, item => {
    return (
      item === reference ||
      (isPlainObject(item) && !isUndefined(item[key]) && item[key] === reference) ||
      (isPlainObject(reference) && !isUndefined(reference[key]) && item[key] === reference[key])
    );
  });

  return {
    index,
    item: items[index]
  };
}

export function addItem(
  items: any[],
  newItem: any,
  options: {
    at?: number;
  } = {}
) {
  const { at } = options;
  const { index } = findItem(items, newItem);

  if (index < 0) {
    items.splice(isNumber(at) ? at : items.length, 0, newItem);
  }
}

export function removeItem<I>(
  items: I[],
  target: any,
  options: {
    key?: string;
  } = {}
): I | undefined {
  const { index } = findItem(items, target, options);
  const [removed] = index !== -1 ? items.splice(index, 1) : [];

  return removed;
}

export function removeItems<I>(
  items: I[],
  targets: any[],
  options: {
    key?: string;
  } = {}
): (I | undefined)[] {
  return targets.map(target => removeItem(items, target, options));
}

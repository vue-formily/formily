import { FieldInstance, FieldValue, SchemyInstance } from '@/types';
import { ELEMENT_DATA_TYPES } from '../constants';
import { isEmpty, isFunction, isPlainObject } from '@vue-formily/util';
import { def } from '@/utils';

const { NUMBER, STRING, BOOLEAN, DATE } = ELEMENT_DATA_TYPES;
const ron = /^on[^a-z]/;

const CALLBACK_SYMBOL = Symbol('__is_callback__');

export function isCallback(fn: any): boolean {
  return fn && fn[CALLBACK_SYMBOL] === true;
}

/**
 * Checks if the property name follows the standard event naming convention.
 * Matches: onClick, onUpdate, on-click, onTouchStart.
 * Does NOT match: only, online, onion (to avoid false positives).
 */
function isOn(key: string) {
  return ron.test(key);
}

/**
 * Recursively applies properties to a source object, handling deep merging for objects,
 * replacement for arrays, and lazy evaluation for computed properties.
 *
 * This function ensures that:
 * 1. Nested objects are deeply merged to preserve reactivity structure.
 * 2. Arrays are REPLACED (not merged) to prevent stale data issues.
 * 3. Functions (not events) are treated as computed properties via getters (Lazy).
 * 4. Primitives and Events are assigned directly.
 *
 * @param instance - The Schemy/Field instance context.
 * @param source - The target reactive object (usually `this.props`).
 * @param properties - The new properties to apply.
 */
export function genProps(instance: SchemyInstance, source: Record<string, any>, properties: any) {
  for (const key in properties) {
    const prop = properties[key];

    // Identify if the property is an Event Handler or a Callback
    const isEventKey = isCallback(prop) || isOn(key);
    // Identify if the property is a structure (Object or Array)
    const isNested = isPlainObject(prop) || Array.isArray(prop);

    if (isFunction(prop)) {
      if (!isEventKey) {
        // [Computed Properties]
        // Use `def` (Object.defineProperty) to create a getter.
        // The function is executed ONLY when the property is accessed (Lazy Evaluation).
        // This prevents unnecessary execution of logic during initialization.
        def(source, key, {
          get: () => {
            const result = prop.call(instance, instance);
            return instance.hook.roll('base.prop', { value: result });
          },
          configurable: true,
          enumerable: true
        });
      } else {
        // [Event Handlers]
        // Assign directly (or wrap) to bind the correct context.
        source[key] = (...args: any[]) => prop.call(instance, instance, ...args);
      }
    } else if (isNested) {
      let baseSource = source[key];

      if (isPlainObject(prop)) {
        // [Object Strategy: Deep Merge]
        // If the source exists and is an object, reuse it to maintain reactivity.
        // Otherwise, initialize a new object.
        baseSource = isPlainObject(baseSource) ? baseSource : {};
      } else {
        // [Array Strategy: Replace]
        // We initialize an empty array to OVERWRITE the existing one.
        // This ensures that new lists (e.g., options) completely replace old ones
        // instead of merging by index.
        baseSource = [];
      }

      // Recursively process nested properties using the prepared baseSource
      // Assigning the result back to source[key] ensures Vue triggers updates.
      source[key] = genProps(instance, baseSource, prop);
    } else {
      // [Primitives]
      // Direct assignment for simple values (string, number, boolean).
      // This triggers Vue's reactive setters immediately.
      source[key] = instance.hook.roll('base.prop', { value: prop });
    }
  }

  return source;
}

export function toRaw(value: any): any {
  if (Array.isArray(value)) {
    return value.map(toRaw);
  } else if (isPlainObject(value)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = toRaw(value[key]);

      return acc;
    }, {} as any);
  }

  return String(value || '');
}

export function getFieldValue(field: FieldInstance) {
  const { type, raw, checkedValue } = field;
  let value: FieldValue;

  if (isEmpty(raw)) {
    value = type === STRING ? '' : null;
  } else if (type === NUMBER) {
    value = +raw;
  } else if (type === BOOLEAN) {
    value = raw === checkedValue;
  } else if (type === DATE) {
    value = new Date(raw);
  } else {
    value = String(raw);
  }

  return value;
}

export function genAlias(name: string) {
  return `$${name}`;
}

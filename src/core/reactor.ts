import { get, isPlainObject, isUndefined } from '@vue-formily/util';
import { Reactor, ReactorOptions } from '@/types';

function defaultSetter(target: any, key: string, value: any) {
  target[key] = value;
}

function defaultDeleter(target: any, key: string) {
  delete target[key];
}

/**
 * Factory to create a Reactor using Vue 3's reactivity system.
 * It uses `reactive()` (Proxy) internally.
 */
export function createReactor<T extends object>(initialData: T, options: ReactorOptions = {}): Reactor<T> {
  // In Vue 3, initialData is expected to be a Proxy (reactive object)
  const state = initialData;
  const setter = options.setter || defaultSetter;
  const deleter = options.deleter || defaultDeleter;

  /**
   * Internal merge using the injected setter.
   * This ensures compatibility with Vue 2 (Vue.set) during deep merges.
   */
  function reactiveMerge(target: any, source: any) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
        reactiveMerge(targetValue, sourceValue);
      } else {
        setter(target, key, sourceValue);
      }
    });

    return target;
  }

  /**
   * Helper to resolve parent object and key from a path string or array.
   */
  function resolveTarget(keyOrPath: string | string[]) {
    // Clone array to avoid mutation or split string path
    const path = Array.isArray(keyOrPath) ? [...keyOrPath] : [keyOrPath];

    if (path.length === 0) return { parent: undefined, key: undefined };

    const key = path.pop() as string;

    // Resolve parent. If path was empty after pop, parent is the root state.
    const parent = path.length === 0 ? state : get(path, state);

    return { parent, key };
  }

  return {
    get(key) {
      // Accessing the property triggers Vue's dependency tracking
      return state[key];
    },

    set(keyOrPath: string | string[], value?: any) {
      const { parent, key } = resolveTarget(keyOrPath);

      if (parent && !isUndefined(key)) {
        setter(parent, key as string, value);
      }

      return this;
    },

    patch(keyOrPathOrObj: string | string[] | object, value?: object) {
      // Scenario 1: Root level patch -> reactor.patch({ a: 1 })
      if (isPlainObject(keyOrPathOrObj)) {
        reactiveMerge(state, keyOrPathOrObj);
      } else {
        // Scenario 2: Nested path patch -> reactor.patch('a.b', { x: 1 })
        const { parent, key } = resolveTarget(keyOrPathOrObj as string | string[]);

        if (parent && !isUndefined(key)) {
          const currentTarget = parent[key as string];

          // We can only "patch" (merge) if both the current value and the new value are objects.
          if (isPlainObject(currentTarget) && isPlainObject(value)) {
            reactiveMerge(currentTarget, value);
          } else {
            // Fallback: If target isn't an object (e.g. null/undefined),
            // we treat this as a Set operation.
            setter(parent, key as string, value);
          }
        }
      }

      return this;
    },

    /**
     * Deletes a property from the state.
     * Required for dynamic forms (e.g., removing items from a list or cleaning up props).
     */
    delete(keyOrPath: string | string[]) {
      const { parent, key } = resolveTarget(keyOrPath);

      if (parent && key) {
        deleter(parent, key);
      }

      return this;
    },

    get value() {
      return state;
    }
  };
}

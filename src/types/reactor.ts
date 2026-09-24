export interface ReactorOptions {
  setter?: (target: any, key: string, value: any) => void;
  deleter?: (target: any, key: string) => void;
}

/**
 * Interface defining the contract for a reactive state adapter.
 * It abstracts the underlying reactivity system (Vue, React, etc.)
 * and supports nested path updates.
 *
 * @template T - The shape of the state object.
 */
export interface Reactor<T extends object = any> {
  /**
   * Retrieves the value of a direct property.
   * Implementation should handle dependency tracking.
   *
   * @param key - The top-level property key.
   */
  get<K extends keyof T>(key: K): T[K];

  /**
   * Updates a property value.
   * Supports both direct keys and nested paths via array.
   *
   * @param keyOrPath - A single key ('prop') or a path array (['props', 'style', 'color']).
   * @param value - The new value to set.
   *
   * @example
   * reactor.set('disabled', true);
   * reactor.set(['options', 'layout', 'width'], 100);
   */
  set(keyOrPath: string | string[], value: any): this;

  /**
   * PATCH (Root): Merges the provided object into the root state.
   * Performs a shallow merge.
   *
   * @example
   * reactor.patch({ status: 'active' }); // Only updates 'status', keeps others.
   */
  patch(partialState: Partial<T>): this;

  /**
   * PATCH (Nested): Merges the provided object into the object at the specified path.
   * If the target at path is not an object, it falls back to replacement.
   *
   * @example
   * reactor.patch('user.settings', { theme: 'dark' }); // Merges 'theme' into 'user.settings'.
   */
  patch(keyOrPath: string | string[], partialValue: object): this;

  /**
   * Deletes a property from the state.
   * Supports both direct keys and nested paths via array.
   *
   * @param keyOrPath - A single key ('prop') or a path array (['props', 'style']).
   *
   * @example
   * reactor.delete('tempData');
   * reactor.delete(['items', '0']); // Remove item at index 0
   */
  delete(keyOrPath: string | string[]): this;

  /**
   * Access to the underlying state object.
   * Useful for passing the state directly to UI frameworks.
   */
  readonly value: T;
}

/**
 * Type definition for the factory function that creates a Reactor.
 */
export type ReactorFactory = <T extends object>(initialData: T) => Reactor<T>;

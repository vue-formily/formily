import { reactive } from 'vue';
import { Reactor } from './types';
import { createReactor } from './core/reactor';

/**
 * Factory function to create a Vue 3 reactive adapter.
 */
export function createVueReactor<T extends object>(initialData = {} as T): Reactor<T> {
  const reactiveData = reactive(initialData) as T;

  return createReactor<T>(reactiveData);
}

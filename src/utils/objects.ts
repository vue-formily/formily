import { isPlainObject } from '@vue-formily/util';
import { markRaw } from 'vue';

export function readonlyDumpProp(obj: any, key: string, value: any, descriptor?: Record<string, any>) {
  return def(obj, key, {
    value: isPlainObject(value) ? markRaw(value) : value,
    writable: false,
    configurable: false,
    ...descriptor
  });
}

export function dumpProp(obj: any, key: string, value: any, descriptor?: Record<string, any>) {
  return def(obj, key, {
    value: isPlainObject(value) ? markRaw(value) : value,
    writable: true,
    configurable: false,
    ...descriptor
  });
}

export function def(obj: any, key: string, descriptor?: Record<string, any>) {
  return Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    ...descriptor
  });
}

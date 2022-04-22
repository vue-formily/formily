import { toString } from './strings';

export function isUndefined(value: any) {
  return value === undefined;
}

export function isPromise(promise: any) {
  return promise && typeof promise.then === 'function' && toString(promise) === '[object Promise]';
}

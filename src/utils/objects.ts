export function def(obj: any, key: string, descriptor?: Record<string, any>) {
  return Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    ...descriptor
  });
}

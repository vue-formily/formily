export function readonlyDumpProp(obj: any, key: string, value: any, descriptor?: Record<string, any>) {
  return def(obj, key, {
    value,
    writable: false,
    configurable: false,
    ...descriptor
  });
}

export function dumpProp(obj: any, key: string, value: any, descriptor?: Record<string, any>) {
  return def(obj, key, {
    value,
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

export function readonlyDef(obj: any, key: string, get: () => any, descriptor?: Record<string, any>) {
  return def(obj, key, { get, ...descriptor });
}

export function def(obj: any, key: string, descriptor?: Record<string, any>) {
  return Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    ...descriptor
  });
}

export function getEnumValues<T extends Record<string, any>>(
  obj: T,
  {
    keys
  }: {
    keys?: string[];
  } = {}
) {
  return (keys || Object.keys(obj)).map(key => obj[key as keyof T]);
}

export function getValues(
  input: Record<string, any> | Record<string, any>[],
  options: {
    keys?: string[];
  } = {}
) {
  return Array.isArray(input) ? input.map(value => getEnumValues(value, options)) : [getEnumValues(input, options)];
}

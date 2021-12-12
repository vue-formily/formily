export function logMessage(message?: string, infos?: Record<string, string>) {
  const infosText = infos
    ? `(${Object.keys(infos)
        .map((name: string) => `${name}: "${infos[name]}"`)
        .join(', ')}) `
    : '';
  return `[vue-formily] ${infosText}${message}`;
}

export function toString(value: any) {
  return '' + value;
}

export function throwFormilyError(...args: any[]): never {
  throw new Error(logMessage(...args));
}

export function createFormilyError(message?: string, meta?: Record<string, string>) {
  const metaMessage = meta
    ? `(${Object.keys(meta)
        .map((name: string) => `${name}: "${meta[name]}"`)
        .join(', ')}) `
    : '';

  return new Error(`[vue-formily] ${metaMessage}${message}`);
}

let _uid = 0;

export function uid(prefix = 'u'): string {
  return `${prefix}${(++_uid).toString(36)}`;
}

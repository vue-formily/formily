import { isFunction, isString } from '@vue-formily/util';

export type Format = (...args: any[]) => string;

export function formatter(
  format: string | Format | null | undefined,
  type = 'string',
  context: Record<string, any>,
  ...args: any[]
): string | null {
  const { plugs = {} } = context;
  const FORMATER = `${type}Format`;
  const _formatter = (plugs as any)[FORMATER];
  const translater = (plugs as any).i18n;
  let result: string | null = null;
  const formatting = isFunction(format) ? format.call(context, context, ...args) : format;

  if (isString(formatting)) {
    result = translater ? translater.translate(formatting, context, ...args) : formatting;

    if (_formatter) {
      result = _formatter.format(result, [context], ...args);
    }
  }

  return result;
}

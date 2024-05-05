import { isFunction, isString } from '@vue-formily/util';

export type Format = (...args: any[]) => string;

export function formatter(
  format: string | Format | null | undefined,
  type = 'string',
  context: Record<string, any>,
  ...args: any[]
): string | null {
  const { plugs = {} } = context;
  const FORMATTER = `${type}Format`;
  const _formatter = (plugs as any)[FORMATTER];
  const translator = (plugs as any).i18n;
  let result: string | null = null;
  const formatting = isFunction(format) ? format.call(context, context, ...args) : format;

  if (isString(formatting)) {
    result = translator ? translator.translate(formatting, context, ...args) : formatting;

    if (_formatter) {
      result = _formatter.format(result, [context], ...args);
    }
  }

  return result;
}

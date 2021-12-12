import { ElementsSchemas } from '../core/elements/types';
import { findIndex, get, isFunction, isPlainObject, isString, merge } from '@vue-formily/util';
import { ValidationRuleSchema, Validator } from '../core/validations/types';

import { isUndefined, def, throwFormilyError } from '../utils';

export function genField(schema: ElementsSchemas, parent: any, ...args: any[]) {
  const elements = parent._config.elements;
  const element = elements.find((e: any) => e.FORM_TYPE === schema.formType);
  const length = elements.length;
  const { formId } = schema;

  if (!length) {
    throwFormilyError('No form elements have been registed yet');
  } else if (!element) {
    throwFormilyError('`formType` is not defined or supported', {
      formId
    });
  }

  return element.create(schema, parent, ...args);
}

export function cascadeRule<T extends ElementsSchemas>(fieldSchema: T, parentRules?: ValidationRuleSchema[]): T {
  const schema = merge({}, fieldSchema);

  if (parentRules) {
    const { rules = [] } = schema;

    parentRules.forEach(parentRule => {
      const index = findIndex(rules as any, (rule: any) => rule.name === parentRule.name);
      const rule = rules[index];

      if (
        !isFunction(parentRule) &&
        parentRule.cascade &&
        (!rule || (rule as Exclude<ValidationRuleSchema, Validator>).inherit !== false)
      ) {
        rules[index < 0 ? 0 : index] = merge({}, parentRule, rule);
      }
    });

    if (rules.length) {
      schema.rules = rules;
    }
  }

  return schema;
}

export function genHtmlName(Element: any, ancestors: any[] | null): string {
  const keysPath = ancestors
    ? ancestors.reduce((acc: string[], fe) => {
        return 'index' in fe ? [...acc, '' + fe.index] : [...acc, fe.formId];
      }, [])
    : [];
  const [root, ...rest] = [...keysPath, 'index' in Element ? '' + Element.index : Element.formId];
  const htmlName = rest ? `${root}[${rest.join('][')}]` : root;

  return Element.type === 'set' ? `${htmlName}[]` : htmlName;
}

export function getProp(element: any, path: string, options: { up?: boolean } = {}) {
  let prop = get(path, element.props);
  const parent = element.parent;

  if (options.up && isUndefined(prop) && parent) {
    prop = getProp(parent, path, options);
  }

  return prop;
}

export function genProps(this: any, source: Record<string, any>, properties: any, ...args: any[]) {
  for (const key in properties) {
    const prop = properties[key];
    const newSource = isPlainObject(prop) ? {} : Array.isArray(prop) ? [] : null;

    if (newSource) {
      source[key] = genProps.call(this, newSource, prop, ...args);
    } else if (isFunction(prop)) {
      def(source, key, {
        get: () => prop.call(this, this, ...args)
      });
    } else {
      const translater = this.plugs.i18n;

      source[key] = isString(prop) && translater ? translater.translate(prop, this, ...args) : prop;
    }
  }

  return source;
}

export function normalizeSchema(schema: ElementsSchemas, type: string) {
  const rules = (schema.rules || []).filter(rule => isFunction(rule) || !rule.for || (type && rule.for.includes(type)));

  return merge(
    {
      __origin: schema
    },
    schema,
    {
      rules
    }
  );
}

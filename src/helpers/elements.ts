import { ElementsSchemas } from '../core/elements/types';
import { findIndex, get, isFunction, isPlainObject, isString, merge } from '@vue-formily/util';
import { ValidationRuleSchema, Validator } from '../core/validations/types';

import { logMessage, isUndefined, def } from '../utils';

export function genField(schema: ElementsSchemas, parent: any, ...args: any[]) {
  const elements = parent._config.elements;
  const length = elements.length;
  let invalidSchema: any;

  if (!length) {
    throw new Error(logMessage('No form elements have been registed yet'));
  }

  for (let i = 0; i < length; i++) {
    const F = elements[i];
    const accepted = F.accept(schema);

    if (accepted.valid) {
      return F.create(schema, parent, ...args);
    }

    invalidSchema = schema;
  }

  throw new Error(
    logMessage(
      `Failed to create form elmenent, caused by schema:\n ${JSON.stringify(invalidSchema, null, 2).slice(
        0,
        50
      )}\n\t...\n`
    )
  );
}

export function cascadeRules(parentRules: ValidationRuleSchema[], fields: ElementsSchemas[]) {
  return parentRules
    ? fields.map(fieldSchema => {
        const { rules = [] } = fieldSchema;

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
          fieldSchema.rules = rules;
        }

        return fieldSchema;
      })
    : fields;
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

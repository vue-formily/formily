import { ElementsSchemas } from '../core/elements/types';
import { findIndex, get, isFunction, isPlainObject, isString, merge } from '@vue-formily/util';
import { ValidationRuleSchema, Validator } from '../core/validations/types';
import { isUndefined, def, isPromise, dumpProp, readonlyDef } from '../utils';
import { formatter } from './formatter';

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
        rules[index < 0 ? 0 : index] = merge(
          {
            __cascaded: true,
            __origin: rule
          },
          parentRule,
          rule
        );
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
      this._d.asyncProps =
        this._d.asyncProps ||
        dumpProp(
          {
            values: {}
          },
          'asigned',
          {}
        );

      def(source, key, {
        get: () => {
          const asyncProps = this._d.asyncProps;
          const asyncValue = asyncProps.values[key];
          let result;

          if (asyncValue && !asyncProps.asigned[key]) {
            result = asyncValue;

            delete asyncProps.asigned[key];
          } else {
            result = prop.call(this, this, ...args);
          }

          if (isPromise(result)) {
            result.then((value: any) => {
              // Trigger Vue re-render
              asyncProps.values[key] = value;
              asyncProps.asigned[key] = false;
            });
          }

          return result;
        }
      });
    } else {
      source[key] = isString(prop) ? formatter(prop, 'string', this, ...args) : prop;
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

export function genValueFromElements(value: any, elements: any[]) {
  const length = elements.length;

  for (let i = 0; i < length; i++) {
    const element = elements[i] as any;

    if (!element.valid) {
      return null;
    }

    readonlyDef(value, isPlainObject(value) ? element.model : element.index, () => element.value);
  }

  return value;
}

export async function updateValue(this: any, elements: any[]) {
  const { _d, type } = this;

  _d.tempValue = genValueFromElements(type === 'enum' ? {} : [], elements);

  if (this.options.silent) {
    await this.validate({ cascade: false });
  }
}

export function addFieldOrGroup(
  this: any,
  item: any,
  changedHandler: (...args: any[]) => void,
  validatedHandler: () => void,
  done: () => void
) {
  item
    .on('changed:formy', (...args: any[]) => changedHandler.apply(this, args), { noOff: true })
    .on('validated:formy', () => validatedHandler.call(this), { noOff: true });

  const tempEventName = `validated:__${this.htmlName}`;

  this.on(tempEventName, () => {
    this.emit(`${this.formType}added`, item).emit('changed', this).off(tempEventName);

    done();
  });
}

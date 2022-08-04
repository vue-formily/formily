import { ElementsSchemas } from '../core/elements/types';
import { findIndex, isEqual, isFunction, isPlainObject, isString, merge } from '@vue-formily/util';
import { ValidationRuleSchema, Validator } from '../core/validations/types';
import { def, isPromise } from '../utils';
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

export function genProps(this: any, source: Record<string, any>, properties: any, ...args: any[]) {
  for (const key in properties) {
    const prop = properties[key];
    const newSource = isPlainObject(prop) ? {} : Array.isArray(prop) ? [] : null;

    if (newSource) {
      source[key] = genProps.call(this, newSource, prop, ...args);
    } else if (isFunction(prop)) {
      const { _d } = this;

      _d.asyncProps = _d.asyncProps || {
        values: {},
        asigned: {}
      };

      def(source, key, {
        get: () => {
          const asyncProps = _d.asyncProps;
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

    value[isPlainObject(value) ? element.model : element.index] = element.value;
  }

  return value;
}

export async function updateValue(this: any, elements: any[]) {
  const { _d, type } = this;
  const curValue = this.value && merge({}, this.value);

  _d.tempValue = genValueFromElements(type === 'enum' ? {} : [], elements);

  if (this.options.silent) {
    await this.validate({ cascade: false });
  }

  if (!isEqual(this.value, curValue)) {
    this.emit('changed', this.value, curValue, this);
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
    this.emit(`${this.formType}added`, item).off(tempEventName);

    done();
  });
}

export async function resetItems(this: any, items: any[] = []) {
  this.cleanUp();

  this.validation.reset();

  await Promise.all(items.map(async (item: any) => await item.reset()));
}

export async function clearItems(this: any, items: any[] = []) {
  this.cleanUp();

  await Promise.all(items.map(async (item: any) => await item.clear()));
}

export async function validateItems(this: any, { cascade = true }: { cascade?: boolean } = {}, items: any[]) {
  this.emit('validate', this);

  const data = this._d;
  const value = data.tempValue || this.value;

  if (cascade) {
    await Promise.all(items.map(async (group: any) => await group.validate()));
  }

  await this.validation.validate(value, this.props, this);

  data.r.value = this.valid ? value : null;
  data.tempValue = null;

  this.emit('validated', this);

  return this.valid as boolean;
}

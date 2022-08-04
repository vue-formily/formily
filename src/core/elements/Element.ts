import { isString, merge } from '@vue-formily/util';
import { ElementOptions, ElementSchema } from './types';
import { genHtmlName, genProps } from '../../helpers';
import { throwFormilyError } from '../../utils';
import Objeto from '../Objeto';
import { Validation } from '../validations';

export interface ElementData {
  r: {
    shaked: boolean;
    invalidated: string | boolean;
    validation: Validation;
    data: Record<string, any>;
  };
  ancestors: any[] | null;
  schema: any;
  options: ElementOptions;
  parent: Element | null;
}

function genElementAncestors(elem: Element): any[] | null {
  const path = [];

  let parent = elem.parent;

  while (parent) {
    path.unshift(parent);
    parent = parent.parent;
  }

  return path.length ? path : null;
}

let _options = {
  silent: true
} as ElementOptions;

export default abstract class Element extends Objeto {
  static accept(schema: any) {
    ['formId'].forEach(prop => {
      if (!prop) {
        throwFormilyError(`${prop} is not defined`);
      }
    });

    return schema;
  }

  static register(options: ElementOptions) {
    _options = merge(_options, options);
  }

  protected _d!: ElementData;

  props: Record<string, any> = {};

  constructor(schema: ElementSchema, parent?: Element | null) {
    super();

    Element.accept(schema);

    const data = this._d;
    const reactive = data.r;
    const { props = {}, on = {}, options, rules = [] } = schema;

    reactive.data = {};
    reactive.shaked = false;
    reactive.invalidated = false;
    data.parent = parent || null;
    data.schema = schema;
    data.ancestors = genElementAncestors(this);
    data.options = merge({}, _options, options);

    genProps.call(this, this.props, props);

    Object.keys(on).map(name => this.on(name, on[name]));

    reactive.validation = new Validation(rules, this);
  }

  get parent() {
    return this._d.parent;
  }

  get shaked() {
    return this._d.r.shaked;
  }

  get pending() {
    return this.validation.pending;
  }

  get model() {
    return this.schema.model || this.formId;
  }

  get schema() {
    return this.getSchema();
  }

  get options(): ElementOptions {
    return this._d.options;
  }

  get validation() {
    return this._d.r.validation;
  }

  get error() {
    const {
      shaked,
      invalidated,
      validation: { errors }
    } = this._d.r;

    if (!shaked || this.valid) {
      return null;
    }

    return invalidated === true ? null : isString(invalidated) ? invalidated : errors ? errors[0] : null;
  }

  get data() {
    return this._d.r.data;
  }

  getSchema(): Record<string, any> {
    const schema = this._d.schema.__origin;
    const rules = this.validation.getSchema();

    if (rules) {
      schema.rules = rules;
    } else {
      delete schema.rules;
    }

    return schema;
  }

  get formId(): string {
    return this.schema.formId;
  }

  get htmlName() {
    return this.getHtmlName();
  }

  get valid() {
    return this.isValid();
  }

  isValid() {
    return !this._d.r.invalidated && this.validation.valid;
  }

  getHtmlName() {
    return genHtmlName(this, this._d.ancestors);
  }

  shake() {
    this._d.r.shaked = true;
  }

  cleanUp() {
    this._d.r.shaked = false;
    this._d.r.invalidated = false;
  }

  invalidate(message?: string) {
    this._d.r.invalidated = message || true;
  }
}

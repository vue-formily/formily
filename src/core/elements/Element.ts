import { merge } from '@vue-formily/util';
import { ElementData, ElementOptions, ElementSchema } from './types';
import { genHtmlName, getProp, genProps } from '../../helpers';
import { dumpProp, readonlyDumpProp, throwFormilyError } from '../../utils';
import Objeto from '../Objeto';
import { Validation } from '../validations';

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

  readonly parent!: Element | null;

  protected _d!: ElementData;

  props: Record<string, any> = {};
  data = new WeakMap();

  shaked = false;

  abstract isValid(): boolean;

  constructor(schema: ElementSchema, parent?: Element | null) {
    super();

    Element.accept(schema);

    this.parent = parent || null;

    const data = this._d;

    readonlyDumpProp(data, 'schema', schema);

    const { props = {}, on = {}, options, rules = [] } = schema;

    dumpProp(data, 'ancestors', genElementAncestors(this));
    dumpProp(data, 'options', merge({}, _options, options));

    this.addProps(props);

    Object.keys(on).map(name => this.on(name, on[name]));

    this._d.validation = new Validation(rules);
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
    return this._d.validation;
  }

  get error() {
    if (!this.shaked || this.valid) {
      return null;
    }

    return this.validation.errors ? this.validation.errors[0] : null;
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

  getProps(path: string, options?: { up?: boolean }) {
    return getProp(this, path, options);
  }

  addProps(props: Record<string, any>, ...args: any[]) {
    genProps.call(this, this.props, props, ...args);
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

  getHtmlName() {
    return genHtmlName(this, this._d.ancestors);
  }

  shake() {
    this.shaked = true;
  }

  cleanUp() {
    this.shaked = false;
  }
}

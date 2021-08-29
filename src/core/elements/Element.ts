import { ElementData, ElementSchema } from './types';
import { genHtmlName, getProp, genProps } from '../../helpers';
import { dumpProp, readonlyDumpProp } from '../../utils';
import Objeto from '../Objeto';

function genElementAncestors(elem: Element): any[] | null {
  const path = [];

  let parent = elem.parent;

  while (parent) {
    path.unshift(parent);
    parent = parent.parent;
  }

  return path.length ? path : null;
}

export default abstract class Element extends Objeto {
  static register() {}
  static unregister() {}

  readonly parent!: Element | null;
  readonly model!: string;
  protected _d!: ElementData;

  props: Record<string, any> = {};

  shaked = false;

  abstract isValid(): boolean;

  constructor(schema: ElementSchema, parent?: Element | null) {
    super();

    const data = this._d;

    readonlyDumpProp(data, 'schema', schema);

    const { model, props = {}, on = {} } = schema;

    readonlyDumpProp(this, 'parent', parent || null);
    readonlyDumpProp(this, 'model', model || this.formId);

    dumpProp(data, 'ancestors', genElementAncestors(this));

    this.addProps(props);

    Object.keys(on).map(name => this.on(name, on[name]));
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

  getVm() {
    return this.getProps('_formy.vm', { up: true });
  }

  getProps(path: string, options?: { up?: boolean }) {
    return getProp(this, path, options);
  }

  addProps(props: Record<string, any>, ...args: any[]) {
    genProps.call(this, this.props, props, ...args);
  }

  get formId(): string {
    return this._d.schema.formId || '' + Date.now();
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

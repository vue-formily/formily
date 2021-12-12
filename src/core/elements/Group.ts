import { findIndex, isNumber, isPlainObject } from '@vue-formily/util';
import { ElementData, GroupSchema, ElementsSchemas } from './types';

import { cascadeRule, genField, normalizeSchema } from '../../helpers';
import Element from './Element';
import { readonlyDef, throwFormilyError } from '../../utils';

type GroupData = Omit<ElementData, 'schema'> & {
  schema: GroupSchema;
  value: Record<string, any> | null;
  pending: boolean;
};

const FORM_TYPE = 'group';
const TYPE = 'enum';

function genFieldProp(fieldOrModel: any) {
  return `$${isPlainObject(fieldOrModel) ? fieldOrModel.model : fieldOrModel}`;
}

async function onFieldChanged(this: Group, ...args: any[]) {
  const [field] = args;
  const { valid, model } = field;

  this._d.pending = true;

  if (valid) {
    let value = this._d.value;

    if (!value) {
      value = this._d.value = {};
    }

    readonlyDef(value, model, () => field.value);
  }

  if (this.options.silent) {
    await this.validate({ cascade: false });
  }

  this.emit('changed', this, ...args);
}

export default class Group extends Element {
  static FORM_TYPE = FORM_TYPE;

  static accept(schema: any): GroupSchema {
    const { fields, formId } = schema;

    if (!Array.isArray(fields)) {
      throwFormilyError('`fields` must be an array.', { formId });
    }

    return normalizeSchema(schema, TYPE);
  }

  static create(schema: GroupSchema, parent?: Element | null) {
    return new Group(schema, parent);
  }

  protected _d!: GroupData;

  fields: Element[] = [];

  constructor(schema: GroupSchema, parent?: Element | null) {
    super(Group.accept(schema), parent);

    schema.fields.forEach(field => this.addField(field));

    this._d.value = null;
  }

  get type() {
    return TYPE;
  }

  get formType() {
    return FORM_TYPE;
  }

  get pending() {
    return this._d.pending;
  }

  get value() {
    return this._d.value;
  }

  getSchema(): GroupSchema {
    return {
      ...(super.getSchema() as GroupSchema),
      fields: this.fields.map(({ schema }) => schema as ElementsSchemas)
    };
  }

  async setValue(obj: Record<string, any>) {
    if (!isPlainObject(obj)) {
      throwFormilyError('Invalid value, Group value must be an object');
    }

    await Promise.all(
      Object.keys(obj).map(async model => {
        const field = (this as any)[genFieldProp(model)];

        if (field) {
          await field.setValue(obj[model]);
        }
      })
    );

    return this.value;
  }

  shake({ cascade = true }: { cascade?: boolean } = {}) {
    super.shake();

    if (cascade) {
      this.fields.forEach(field => field.shake());
    }
  }

  isValid(): boolean {
    return this.validation.valid && !this.fields.some(field => !field.valid);
  }

  reset() {
    this.cleanUp();

    this.fields.forEach((field: any) => field.reset());

    this.validation.reset();
  }

  async clear() {
    this.cleanUp();

    await Promise.all(this.fields.map(async (field: any) => await field.clear()));
  }

  addField(schema: ElementsSchemas, { at }: { at?: number } = {}): Element {
    const field = genField(cascadeRule(schema, this._d.schema.rules), this);
    const prop = genFieldProp(field);

    if (prop in this) {
      throwFormilyError(`Dupplicated model: ${field.model}`);
    }

    (this as any)[prop] = field;

    field.on('changed:formy', (...args: any[]) => onFieldChanged.apply(this, args), { noOff: true });

    this.fields.splice(isNumber(at) ? at : this.fields.length, 0, field);

    return field;
  }

  removeField(elementOrId: Record<string, any> | string) {
    const formId = isPlainObject(elementOrId) ? elementOrId.formId : elementOrId;
    const index = findIndex(this.fields, field => field.formId === formId);

    if (index !== -1) {
      const [field] = this.fields.splice(index, 1);

      delete (this as any)[genFieldProp(field)];
    }
  }

  async validate({ cascade = true }: { cascade?: boolean } = {}) {
    this.emit('validate', this);

    if (cascade) {
      await Promise.all(
        this.fields.filter((field: any) => 'validate' in field).map(async (field: any) => await field.validate())
      );
    }

    await this.validation.validate(this.value, {}, this.props, this);

    if (!this.valid) {
      this._d.value = null;
    }

    this._d.pending = false;

    this.emit('validated', this);
  }
}

import { findIndex, isNumber, isPlainObject } from '@vue-formily/util';
import { GroupSchema, ElementsSchemas, ReadonlySchema } from './types';

import { addFieldOrGroup, cascadeRule, normalizeSchema, updateValue } from '../../helpers';
import Element, { ElementData } from './Element';
import { throwFormilyError } from '../../utils';
import { GroupInstance } from './instanceTypes';

type GroupData = Omit<ElementData, 'schema'> & {
  schema: GroupSchema;
  value: Record<string, any> | null;
  tempValue?: any;
};

const FORM_TYPE = 'group';
const TYPE = 'enum';

function genFieldProp(fieldOrModel: any) {
  return `$${isPlainObject(fieldOrModel) ? fieldOrModel.model : fieldOrModel}`;
}

function onFieldChanged(this: Group, ...args: any[]) {
  this.emit('changed', ...args, this);
}

function onFieldValidated(this: Group) {
  updateGroupValue.call(this);
}

async function updateGroupValue(this: Group) {
  await updateValue.call(this, this.fields);
}

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

export default class Group extends Element {
  static FORM_TYPE = FORM_TYPE;

  static accept(schema: any): GroupSchema {
    const { fields, formId } = schema;

    if (!Array.isArray(fields)) {
      throwFormilyError('`fields` must be an array.', { formId });
    }

    return normalizeSchema(schema, TYPE);
  }

  static create<F extends ReadonlySchema<GroupSchema>>(schema: GroupSchema, parent?: Element | null) {
    return (new Group((schema as unknown) as GroupSchema, parent) as unknown) as GroupInstance<F>;
  }

  protected _d!: GroupData;

  fields: Element[] = [];

  constructor(schema: GroupSchema, parent?: Element | null) {
    super(Group.accept(schema), parent);

    this._d.value = null;

    Promise.all(schema.fields.map(async field => await this.addField(field)));

    this.emit('created', this);
  }

  get type() {
    return TYPE;
  }

  get formType() {
    return FORM_TYPE;
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

  async reset() {
    this.cleanUp();

    this.validation.reset();

    await Promise.all(this.fields.map(async (field: any) => await field.reset()));
  }

  async clear() {
    this.cleanUp();

    await Promise.all(this.fields.map(async (field: any) => await field.clear()));
  }

  async addField(schema: ElementsSchemas, { at }: { at?: number } = {}): Promise<Element> {
    return new Promise(resolve => {
      const field = genField(cascadeRule(schema, this._d.schema.rules), this);
      const prop = genFieldProp(field);

      if (prop in this) {
        throwFormilyError(`Dupplicated model: ${field.model}`);
      }

      addFieldOrGroup.call(this, field, onFieldChanged, onFieldValidated, () => resolve(field));

      (this._config as any).app.set(this, prop, field);

      this.fields.splice(isNumber(at) ? at : this.fields.length, 0, field);
    });
  }

  async removeField(elementOrId: Record<string, any> | string): Promise<Element | null> {
    const formId = isPlainObject(elementOrId) ? elementOrId.formId : elementOrId;
    const index = findIndex(this.fields, field => field.formId === formId);
    let removed = null;

    if (index !== -1) {
      [removed] = this.fields.splice(index, 1);

      (this._config as any).app.delete(this, genFieldProp(removed));

      await updateGroupValue.call(this);

      this.emit('fieldremoved', removed, this).emit('changed', this);
    }

    return removed;
  }

  async validate({ cascade = true }: { cascade?: boolean } = {}) {
    this.emit('validate', this);

    this.pender.add('formy');

    const _d = this._d;
    const value = _d.tempValue || this.value;

    if (cascade) {
      await Promise.all(
        this.fields.filter((field: any) => 'validate' in field).map(async (field: any) => await field.validate())
      );
    }

    await this.validation.validate(value, {}, this.props, this);

    _d.value = this.valid ? value : null;
    _d.tempValue = null;

    this.pender.kill('formy');

    this.emit('validated', this);

    return this.valid;
  }
}

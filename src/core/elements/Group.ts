import { findIndex, isNumber, isPlainObject } from '@vue-formily/util';
import { GroupSchema, ElementsSchemas, ReadonlySchema } from './types';

import {
  addFieldOrGroup,
  cascadeRule,
  clearItems,
  normalizeSchema,
  resetItems,
  updateValue,
  validateItems
} from '../../helpers';
import Element, { ElementData } from './Element';
import { isUndefined, throwFormilyError } from '../../utils';
import { GroupInstance } from './instanceTypes';

type GroupData = Omit<ElementData, 'schema'> & {
  r: {
    value: Record<string, any> | null;
  };
  tempValue?: any;
  schema: GroupSchema;
};

const FORM_TYPE = 'group';
const TYPE = 'enum';

function genFieldProp(fieldOrModel: any) {
  return `$${isPlainObject(fieldOrModel) ? fieldOrModel.model : fieldOrModel}`;
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

    const { value } = schema;

    this._d.r.value = null;

    Promise.all(schema.fields.map(async field => await this.addField(field))).then(async () =>
      this.setValue(!isUndefined(value) ? value : {}).then(() => this.emit('created', this))
    );
  }

  get type() {
    return TYPE;
  }

  get formType() {
    return FORM_TYPE;
  }

  get value() {
    return this.valid ? this._d.r.value : null;
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
    return super.isValid() && !this.fields.some(field => !field.valid);
  }

  async reset() {
    await resetItems.call(this, this.fields);
  }

  async clear() {
    await clearItems.call(this, this.fields);
  }

  async addField(schema: ElementsSchemas, { at }: { at?: number } = {}): Promise<Element> {
    return new Promise(resolve => {
      const field = genField(cascadeRule(schema, this._d.schema.rules), this);
      const prop = genFieldProp(field);

      if (prop in this) {
        throwFormilyError(`Dupplicated model: ${field.model}`);
      }

      addFieldOrGroup.call(
        this,
        field,
        (...args) => this.emit('fieldchanged', ...args),
        () => updateGroupValue.call(this),
        () => resolve(field)
      );

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

      this.emit('fieldremoved', removed, this);
    }

    return removed;
  }

  validate(options: { cascade?: boolean } = {}) {
    return validateItems.call(this, options, this.fields);
  }
}

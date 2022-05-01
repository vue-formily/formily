import { isNumeric } from '@vue-formily/util';
import { FieldSchema, FieldType, FieldValue, ReadonlySchema } from './types';

import Element, { ElementData } from './Element';
import { toString, readonlyDumpProp, isUndefined, throwFormilyError } from '../../utils';
import { normalizeSchema } from '../../helpers';
import { FieldInstance } from './instanceTypes';

type FieldData = ElementData & {
  error: string | null;
  raw: string;
  checkedValue: any;
  formatted: string | null;
};

const FORM_TYPE = 'field';
const casts: Record<string, (value: any, ...args: any[]) => FieldValue> = {
  string(value: any) {
    return value !== null ? toString(value) : null;
  },
  number(value: any) {
    return isNumeric(value) ? +value : null;
  },
  boolean(value: any) {
    return !!(value === true || value === 'true');
  },
  date(value: any) {
    const date = new Date(value);

    return !isNaN(date.getTime()) ? date : null;
  }
};

export default class Field extends Element {
  static FORM_TYPE = FORM_TYPE;
  static FIELD_TYPE_STRING = 'string';
  static FIELD_TYPE_NUMBER = 'number';
  static FIELD_TYPE_BOOLEAN = 'boolean';
  static FIELD_TYPE_DATE = 'date';

  static accept(schema: any): FieldSchema {
    const { type: schemaType, formId } = schema;
    const type: FieldType = schemaType ? (Field as any)[`FIELD_TYPE_${schemaType.toUpperCase()}`] : 'string';

    if (!type) {
      throwFormilyError('Invalid `type`', { formId });
    }

    return normalizeSchema(schema, type);
  }

  static create<F extends ReadonlySchema<FieldSchema>>(schema: FieldSchema, parent?: Element | null) {
    return (new Field((schema as unknown) as FieldSchema, parent) as unknown) as FieldInstance<F>;
  }

  readonly default!: any;

  protected _d!: FieldData;

  constructor(schema: FieldSchema, parent?: Element | null) {
    super(Field.accept(schema), parent);

    const { default: defu } = schema;

    const hasDefault = !isUndefined(defu);
    readonlyDumpProp(this, 'default', hasDefault ? defu : null);

    const value = !isUndefined(schema.value) ? schema.value : defu;

    const data = this._d;

    data.formatted = null;

    this.setCheckedValue(schema.checkedValue);
    this.setValue(value);

    this.emit('created', this);
  }

  get formType() {
    return FORM_TYPE;
  }

  get type(): FieldType {
    return this.schema.type || 'string';
  }

  get formatted() {
    return this._d.formatted;
  }

  get raw() {
    return this._d.raw;
  }

  set raw(value: any) {
    this.setRaw(value);
  }

  async setRaw(value: any) {
    await this.setValue(value);
  }

  get value() {
    return this.valid ? this.cast(this.raw) : null;
  }

  set value(value: any) {
    this.setValue(value);
  }

  async setValue(value: any) {
    const _d = this._d;
    const curRaw = _d.raw || '';

    _d.raw = !isUndefined(value) ? toString(value) : curRaw;

    const raw = _d.raw;

    if (this.options.silent) {
      await this.validate();
    }

    if (raw !== curRaw) {
      this.emit('changed', raw, curRaw, this);
    }

    return this.value;
  }

  cast(value: any) {
    return casts[this.type](value);
  }

  setCheckedValue(checkedValue: any) {
    this._d.checkedValue = checkedValue;
  }

  get checked() {
    const { checkedValue } = this._d;

    if (this.type === Field.FIELD_TYPE_BOOLEAN) {
      return this.value;
    }

    return !isUndefined(checkedValue) && toString(this.value) === checkedValue;
  }

  isValid() {
    return this.validation.valid;
  }

  async reset() {
    this.cleanUp();
    this.validation.reset();

    await this.setRaw(this.default !== null ? this.default : '');
  }

  async clear() {
    this.cleanUp();

    await this.setValue('');
  }

  async validate() {
    this.pender.add('formy');

    const _d = this._d;

    this.emit('validate', this);

    await this.validation.validate(this.cast(this.raw), {}, this.props, this);

    const format = (_d.schema as FieldSchema).format;

    _d.formatted = format ? this.format(format, this.type) : null;

    this.pender.kill('formy');

    this.emit('validated', this);

    return this.valid;
  }
}

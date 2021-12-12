import { isFunction, isNumeric } from '@vue-formily/util';
import { ElementData, FieldSchema, FieldType, FieldValue } from './types';

import Element from './Element';
import { toString, readonlyDumpProp, isUndefined, throwFormilyError } from '../../utils';
import { normalizeSchema } from '../../helpers';

type FieldData = ElementData & {
  error: string | null;
  raw: string;
  typed: FieldValue;
  checkedValue: any;
  formatted: string | null;
  pending: boolean;
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

function formatter(this: Field): string {
  const { type, _d: data, plugs = {} } = this;
  const { format } = data.schema;
  const FORMATER = `${type}Format`;
  const formatter = (plugs as any)[FORMATER];
  const translater = (plugs as any).i18n;
  let result = null;

  if (format && formatter) {
    const formatting = isFunction(format) ? format.call(this, this) : format;
    const translated = translater ? translater.translate(formatting, this) : formatting;

    result = formatter.format(translated, this);
  }

  return result;
}

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

  static create(schema: FieldSchema, parent?: Element | null): Field {
    return new Field(schema, parent);
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

    data.typed = null;
    data.formatted = null;
    data.pending = false;

    this.setCheckedValue(schema.checkedValue);

    this.setValue(value);
  }

  get formType() {
    return FORM_TYPE;
  }

  get type(): FieldType {
    return this.schema.type || 'string';
  }

  get pending() {
    return this._d.pending;
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
    return this._d.typed;
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
      this.emit('changed', this, curRaw, raw);
    }

    return this.value;
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

  reset() {
    this._d.raw = this.default !== null ? this.default : '';
    this.cleanUp();
    this.validation.reset();
  }

  async clear() {
    this.cleanUp();

    await this.setValue('');
  }

  async validate() {
    const raw = this.raw;
    const cast = casts[this.type];
    const data = this._d;

    data.pending = true;

    this.emit('validate', this);

    const typed = cast(raw);
    const { valid } = await this.validation.validate(typed, {}, this.props, this);

    data.typed = typed !== null && valid ? typed : null;
    data.formatted = formatter.call(this);
    data.pending = false;

    this.emit('validated', this);
  }
}

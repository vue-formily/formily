import { isUndefined } from '@vue-formily/util';
import {
  ConfigParam,
  FieldConfig,
  FieldEvents,
  FieldInternalData,
  FieldReactiveData,
  FieldSchema,
  FieldType,
  FieldValue
} from '@/types';

import { ELEMENT_DATA_TYPES, ELEMENT_TYPES } from '@/constants';
import { Element } from './Element';
import { FIELD_HOOKS } from '@/hooks/field';
import { mergeConfigs } from '@/helpers';

export class Field<
  S extends FieldSchema<any> = FieldSchema<any>,
  C extends FieldConfig = FieldConfig,
  I extends FieldInternalData<S, C> = FieldInternalData<S, C>,
  R extends FieldReactiveData = FieldReactiveData
> extends Element<S, C, I, R> {
  static FORM_TYPE = ELEMENT_TYPES.FIELD as string;

  constructor(schema: S, config?: ConfigParam<FieldConfig>) {
    super(schema, config);

    const { value, default: defu } = schema;

    this.setCheckedValue(schema.checkedValue);
    this.setValue(!isUndefined(value) ? value : defu, { asInitial: true }).then(() =>
      this.emit<FieldEvents, 'created'>('created')
    );
  }

  get defaultConfig(): FieldConfig {
    return mergeConfigs([
      super.defaultConfig,
      {
        hooks: FIELD_HOOKS
      }
    ]);
  }

  get default() {
    return this._d.default;
  }

  get type(): FieldType {
    return this.schema.type || 'string';
  }

  set raw(value: any) {
    this.setRaw(value);
  }

  get raw() {
    return super.raw;
  }

  async setRaw(value: any) {
    await this.setValue(value);
  }

  set value(value: any) {
    this.setValue(value);
  }

  get value() {
    return super.value;
  }

  async setValue(value: any, { asInitial }: { asInitial?: boolean } = {}) {
    this.emit<FieldEvents, 'input'>('input', { value });

    const { raw, prevRaw } = this;

    if (raw !== prevRaw) {
      this.emit<FieldEvents, 'changed'>('changed');
    }

    await this.validate();

    if (asInitial) {
      this.setInitial(this._d.value);
    }

    if (this.value !== this.prevValue) {
      this.emit<FieldEvents, 'updated'>('updated');
    }

    return this.value;
  }

  get checkedValue() {
    const { checkedValue } = this._d;

    if (!checkedValue && this.type === ELEMENT_DATA_TYPES.BOOLEAN) {
      return 'true';
    }

    return checkedValue;
  }

  setCheckedValue(checkedValue?: string) {
    this._d.checkedValue = checkedValue;
  }

  get checked() {
    const { checkedValue } = this;

    return !!this.raw && this.raw === checkedValue;
  }

  get dirty() {
    return this._r.get('value') !== this._d.initialValue;
  }

  setInitial(value: FieldValue) {
    this._d.initialValue = value;
  }

  async reset() {
    this.cleanUp();

    const originalValue = this._d.initialValue;

    await this.setRaw(originalValue);
  }

  async clear() {
    this.cleanUp();

    const defaultValue = this.default !== undefined ? this.default : '';

    await this.setRaw(defaultValue);
  }

  async validate() {
    this.emit<FieldEvents, 'validate'>('validate', { value: this.raw });

    await this.validation.validate(this.raw, this.props);

    this.emit<FieldEvents, 'validated'>('validated', { value: this.value });

    return this.valid;
  }
}

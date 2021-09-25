import { isPlainObject } from '@vue-formily/util';
import { ElementData, GroupSchema } from './types';

import {
  cascadeRules,
  normalizeRules,
  getSchemaAcceptance,
  invalidateSchemaValidation,
  acceptSchema,
  genFields
} from '../../helpers';
import Element from './Element';
import { logMessage, readonlyDumpProp } from '../../utils';
import Validation from '../validations/Validation';

type GroupData = ElementData & {
  value: Record<string, any> | null;
  pending: boolean;
};

const FORM_TYPE = 'group';

async function onFieldChanged(this: Group, ...args: any[]) {
  const [field] = args;

  this._d.pending = true;

  if (field.valid) {
    let value = this._d.value;

    if (!value) {
      value = this._d.value = {};
    }

    value[field.model] = field.value;
  }

  if (this.options.silent) {
    await this.validate({ cascade: false });
  }

  this.emit('changed', this, ...args);
}
export default class Group extends Element {
  static FORM_TYPE = FORM_TYPE;

  static accept(schema: any) {
    const { accepted, sv } = getSchemaAcceptance(schema, FORM_TYPE);

    if (!accepted) {
      const { fields, formId } = schema;

      if (!Array.isArray(fields)) {
        invalidateSchemaValidation(sv, '`fields` must be an array.', { formId });
      }

      if (sv.valid) {
        acceptSchema(schema, FORM_TYPE);
      }
    }

    return sv;
  }

  static create(schema: GroupSchema, parent?: Element | null) {
    return new Group(schema, parent);
  }

  readonly formType!: string;
  readonly type!: 'enum';
  protected _d!: GroupData;

  fields: Element[];

  constructor(schema: GroupSchema, parent?: Element | null) {
    super(schema, parent);

    const accepted = Group.accept(schema);

    if (!accepted.valid) {
      throw new Error(logMessage(`invalid schema, ${accepted.reason}`, accepted.infos));
    }

    readonlyDumpProp(this, 'formType', FORM_TYPE);
    readonlyDumpProp(this, 'type', 'enum');

    if (schema.rules) {
      schema.fields = cascadeRules(schema.rules, schema.fields);
    }

    this.fields = genFields(schema.fields, this) as Element[];

    this.fields.forEach(field => {
      (this as any)[field.model] = field;

      field.on('changed:formy', (...args: any[]) => onFieldChanged.apply(this, args), { noOff: true });
    });

    this._d.validation = new Validation(normalizeRules(schema.rules, this.type));

    this._d.value = null;
  }

  get pending() {
    return this._d.pending;
  }

  get value() {
    return this._d.value;
  }

  async setValue(obj: Record<string, any>) {
    if (!isPlainObject(obj)) {
      throw new Error(logMessage('Invalid value, Group value must be an object'));
    }

    await Promise.all(
      Object.keys(obj).map(async model => {
        const field = (this as any)[model];

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

import { findIndex, isPlainObject } from '@vue-formily/util';
import { CollectionSchema, CollectionItemSchema, ElementsSchemas, GroupSchema } from './types';
import Element, { ElementData } from './Element';
import Group from './Group';
import { cascadeRule, normalizeSchema } from '../../helpers';
import { logMessage, readonlyDef, throwFormilyError } from '../../utils';

const FORM_TYPE = 'collection';
const TYPE = 'set';

export class CollectionItem extends Group {
  get index() {
    const { groups } = this.parent as any;

    return findIndex(groups, (group: any) => group === this);
  }

  get formId() {
    return `${(this.parent as Collection).formId}${this.index}`;
  }
}

type CollectionData = Omit<ElementData, 'schema'> & {
  schema: CollectionSchema;
  value: any[] | null;
  dummy: CollectionItem;
};

async function onGroupChanged(this: Collection, ...args: any[]) {
  const group = args[args.length - 1];

  if (group.valid) {
    let value = this._d.value;

    if (!value) {
      value = this._d.value = [];
    }

    readonlyDef(value, group.index, () => group.value);
  }

  await onCollectionChanged.apply(this, args);
}

async function onCollectionChanged(this: Collection, ...args: any[]) {
  this.pender.add('formy');

  if (this.options.silent) {
    await this.validate({ cascade: false });
  }

  this.emit('changed', ...args, this);
}

function genItem({ rules }: CollectionSchema, groupSchema: CollectionItemSchema, context: Collection) {
  return new CollectionItem(
    cascadeRule(
      {
        formType: 'group',
        ...groupSchema
      } as GroupSchema,
      rules
    ),
    context
  );
}

export default class Collection extends Element {
  static FORM_TYPE = FORM_TYPE;

  static accept(schema: any): CollectionSchema {
    const { formId, group } = schema;

    if (!isPlainObject(group)) {
      throwFormilyError('`group` must be an object', { formId });
    }

    return normalizeSchema(schema, TYPE);
  }

  static create(schema: CollectionSchema, parent?: Element | null) {
    return new Collection(schema, parent);
  }

  protected _d!: CollectionData;

  groups: CollectionItem[] = [];

  constructor(schema: CollectionSchema, parent?: Element | null) {
    super(Collection.accept(schema), parent);

    const data = this._d;

    data.value = null;
    data.dummy = genItem(data.schema, data.schema.group, this);

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

  addField(schema: ElementsSchemas, options?: { at?: number }): Element[] {
    this._d.dummy.addField(schema, options);

    return this.groups.map(group => group.addField(schema, options));
  }

  removeField(id: string): (Element | null)[] {
    this._d.dummy.removeField(id);

    return this.groups.map(group => group.removeField(id));
  }

  getSchema(): CollectionSchema {
    const schema = super.getSchema() as CollectionSchema;
    const [first] = this.groups;

    if (first) {
      schema.group = first.getSchema();
    }

    return schema;
  }

  async setValue(value: any[], { from = 0, autoAdd = true }: { from?: number; autoAdd?: boolean } = {}) {
    if (!Array.isArray(value)) {
      throwFormilyError(logMessage('Invalid value, Group value must be an object'));
    }

    const groups = this.groups ? this.groups.slice(from) : [];

    await Promise.all(
      value.slice(0, autoAdd ? value.length : groups.length).map(async (val: Record<string, any>, index: number) => {
        const group = groups[index];

        if (!group) {
          await this.addGroup().setValue(val);
        } else {
          await group.setValue(val);
        }
      })
    );

    return this.value;
  }

  shake({ cascade = true }: { cascade?: boolean } = {}) {
    super.shake();

    if (cascade && this.groups) {
      this.groups.forEach(group => group.shake());
    }
  }

  isValid(): boolean {
    return this.validation.valid && (!this.groups || !this.groups.some(g => !g.valid));
  }

  reset() {
    this.cleanUp();

    if (this.groups) {
      this.groups.forEach((group: any) => group.reset());
    }

    this.validation.reset();
  }

  async clear() {
    this.cleanUp();

    if (this.groups) {
      await Promise.all(this.groups.map(async (group: any) => await group.clear()));
    }
  }

  addGroup() {
    if (!this.groups) {
      this.groups = [];
    }

    const { schema, dummy } = this._d;
    const groupItem = genItem(schema, dummy.getSchema(), this);

    this.groups.push(groupItem);

    groupItem.on('changed:formy', (...args: any[]) => onGroupChanged.apply(this, args), { noOff: true });

    return groupItem;
  }

  removeGroup(itemOrIndex: CollectionItem | number) {
    const index = itemOrIndex instanceof CollectionItem ? itemOrIndex.index : itemOrIndex;
    const group = this.groups && this.groups[index];

    if (group) {
      const value = this._d.value;

      (this.groups as CollectionItem[]).splice(index, 1);

      if (value) {
        value.splice(index, 1);
      }

      onCollectionChanged.call(this, group);
    }
  }

  async validate({ cascade = true }: { cascade?: boolean } = {}) {
    this.emit('validate', this);

    if (cascade && this.groups) {
      await Promise.all(this.groups.map(async (group: any) => await group.validate()));
    }

    await this.validation.validate(this.value, {}, this.props, this);

    if (!this.valid) {
      this._d.value = null;
    }

    this.pender.kill('formy');

    this.emit('validated', this);
  }
}

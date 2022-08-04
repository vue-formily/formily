import { findIndex, isPlainObject } from '@vue-formily/util';
import { CollectionSchema, CollectionItemSchema, ElementsSchemas, GroupSchema, ReadonlySchema } from './types';
import Element, { ElementData } from './Element';
import Group from './Group';
import {
  cascadeRule,
  normalizeSchema,
  updateValue,
  addFieldOrGroup,
  resetItems,
  clearItems,
  validateItems
} from '../../helpers';
import { isUndefined, logMessage, throwFormilyError } from '../../utils';
import { CollectionInstance, CollectionItemInstance } from './instanceTypes';

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
  r: {
    value: any[] | null;
  };
  schema: CollectionSchema;
  dummy: CollectionItem;
  tempValue?: any;
};

async function updateColectionValue(this: Collection) {
  await updateValue.call(this, this.groups);
}

function genItem<T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>>(
  { rules }: CollectionSchema,
  groupSchema: CollectionItemSchema,
  context: Collection
): CollectionItemInstance<T> {
  return new CollectionItem(
    cascadeRule(
      {
        formType: 'group',
        ...groupSchema
      } as GroupSchema,
      rules
    ),
    context
  ) as CollectionItemInstance<T>;
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

  static create<F extends ReadonlySchema<CollectionSchema>>(schema: CollectionSchema, parent?: Element | null) {
    return (new Collection((schema as unknown) as CollectionSchema, parent) as unknown) as CollectionInstance<F>;
  }

  protected _d!: CollectionData;

  groups: CollectionItem[] = [];

  constructor(schema: CollectionSchema, parent?: Element | null) {
    super(Collection.accept(schema), parent);

    const { value } = schema;
    const data = this._d;

    data.r.value = null;
    data.dummy = genItem(data.schema, data.schema.group, this);

    this.setValue(!isUndefined(value) ? value : []).then(() => this.emit('created', this));
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

  async addField(schema: ElementsSchemas, options?: { at?: number }) {
    await Promise.all(this.groups.map(async group => await group.addField(schema, options)));

    await this._d.dummy.addField(schema, options);
  }

  async removeField(id: string) {
    await Promise.all(this.groups.map(async group => await group.removeField(id)));

    await this._d.dummy.removeField(id);
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

    const groups = this.groups.slice(from);

    await Promise.all(
      value.slice(0, autoAdd ? value.length : groups.length).map(async (val: Record<string, any>, index: number) => {
        let group = groups[index];

        if (!group) {
          group = await this.addGroup();
          await group.setValue(val);
        } else {
          await group.setValue(val);
        }
      })
    );

    return this.value;
  }

  shake({ cascade = true }: { cascade?: boolean } = {}) {
    super.shake();

    if (cascade) {
      this.groups.forEach(group => group.shake());
    }
  }

  isValid(): boolean {
    return super.isValid() && !this.groups.some(g => !g.valid);
  }

  async reset() {
    await resetItems.call(this, this.groups);
  }

  async clear() {
    await clearItems.call(this, this.groups);
  }

  async addGroup<T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>>(): Promise<
    CollectionItemInstance<T>
  > {
    return new Promise(resolve => {
      const { schema, dummy } = this._d;
      const groupItem = genItem(schema, dummy.getSchema(), this);

      this.groups.push(groupItem);

      addFieldOrGroup.call(
        this,
        groupItem,
        (...args) => this.emit('groupchanged', ...args),
        () => updateColectionValue.call(this),
        () => resolve(groupItem)
      );
    });
  }

  async removeGroup<T extends Readonly<Record<string, any>> = Readonly<Record<string, any>>>(
    itemOrIndex: CollectionItem | number
  ): Promise<CollectionItemInstance<T> | null> {
    const index = itemOrIndex instanceof CollectionItem ? itemOrIndex.index : itemOrIndex;
    const removed = (this.groups && this.groups[index]) || null;

    if (removed) {
      (this.groups as CollectionItem[]).splice(index, 1);

      await updateColectionValue.call(this);

      this.emit('groupremoved', removed, this);
    }

    return removed as CollectionItemInstance<T> | null;
  }

  validate(options: { cascade?: boolean } = {}) {
    return validateItems.call(this, options, this.groups);
  }
}

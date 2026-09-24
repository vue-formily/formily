import { isPlainObject, isUndefined } from '@vue-formily/util';

import {
  GroupSchema,
  GroupConfig,
  GroupInternalData,
  GroupReactiveData,
  ElementInstance,
  GroupAddFieldOptions,
  GroupHook,
  AnySchema,
  ConfigParam
} from '@/types';
import { genAlias, mergeConfigs } from '@/helpers';
import { ELEMENT_TYPES } from '@/constants';
import { Container } from './Container';
import { GROUP_HOOKS } from '@/hooks/group';

export class Group<
  S extends GroupSchema = GroupSchema,
  C extends GroupConfig = GroupConfig,
  I extends GroupInternalData<S, C> = GroupInternalData<S, C>,
  R extends GroupReactiveData = GroupReactiveData
> extends Container<S, C, I, R> {
  static FORM_TYPE = ELEMENT_TYPES.GROUP as string;

  constructor(schema: S, config?: ConfigParam<GroupConfig>) {
    super(schema, config);

    const { value } = schema;

    Promise.all(schema.fields.map(async field => await this.addField(field))).then(async () =>
      this.setValue(!isUndefined(value) ? (value as any) : {}, { asInitial: true }).then(() => this.emit('created'))
    );
  }

  get defaultConfig(): GroupConfig {
    return mergeConfigs([
      super.defaultConfig,
      {
        hooks: GROUP_HOOKS
      }
    ]);
  }

  get fields() {
    return this.elements;
  }

  async setRaw(value: Record<string, any>) {
    await this.setValue(value);
  }

  async setValue(value: Record<string, any>, { asInitial }: { asInitial?: boolean } = {}) {
    if (!isPlainObject(value)) {
      this.throw(__DEV__ ? 'Group value must be an object' : '2');
    }

    await Promise.all(
      Object.keys(value).map(async name => {
        const alias = genAlias(name);

        const field = (this as any)[alias];

        if (field) {
          await field.setValue(value[name], { asInitial });
        }
      })
    );

    return this.value;
  }

  async addField(schema: AnySchema, options?: GroupAddFieldOptions) {
    const field = this.hook.roll<GroupHook, 'group.addField'>('group.addField', {
      params: { schema, options }
    });

    await this.addElement(field, options);

    return field;
  }

  async removeField<T extends ElementInstance>(target: T | string): Promise<T | undefined> {
    const element = this.hook.roll<GroupHook, 'group.removeField'>('group.removeField', {
      params: { target }
    });

    const removed = await this.removeElement(element as T);

    return removed;
  }
}

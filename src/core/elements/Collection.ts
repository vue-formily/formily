import { isUndefined } from '@vue-formily/util';
import {
  CollectionSchema,
  CollectionConfig,
  CollectionInternalData,
  CollectionElementInstance,
  CollectionAddGroupOptions,
  CollectionReactiveData,
  CollectionHook,
  ConfigParam
} from '@/types';
import { mergeConfigs } from '@/helpers';
import { ELEMENT_TYPES } from '@/constants';
import { COLLECTION_HOOKS } from '@/hooks/collection';

import { Container } from './Container';

export class Collection<
  S extends CollectionSchema = CollectionSchema,
  C extends CollectionConfig = CollectionConfig,
  I extends CollectionInternalData<S, C> = CollectionInternalData<S, C>,
  R extends CollectionReactiveData = CollectionReactiveData
> extends Container<S, C, I, R> {
  static FORM_TYPE = ELEMENT_TYPES.COLLECTION;

  /**
   * Serializes concurrent setValue calls to prevent race conditions
   * where parallel calls snapshot the same initial groups state.
   */
  private _setValueQueue: Promise<any> = Promise.resolve();

  constructor(schema: S, config?: ConfigParam<CollectionConfig>) {
    super(schema, config);

    const { value = [] } = schema;

    (!isUndefined(value) ? this.setValue(value, { asInitial: true }) : this.validate()).then(() =>
      this.emit('created')
    );
  }

  get defaultConfig(): CollectionConfig {
    return mergeConfigs([
      super.defaultConfig,
      {
        hooks: COLLECTION_HOOKS
      }
    ]);
  }

  get groups() {
    return this.elements as CollectionElementInstance<any>[];
  }

  async setRaw(value: any[]) {
    await this.setValue(value);
  }

  async setValue(
    value: any[],
    { from = 0, autoAdd = true, asInitial }: { from?: number; autoAdd?: boolean; asInitial?: boolean } = {}
  ) {
    // Serialize concurrent calls: each call waits for the previous to finish
    // before snapshotting this.groups, preventing duplicate addGroup calls.
    // Use a recovered queue so errors in one call don't block subsequent calls.
    const result = this._setValueQueue.then(() => this._doSetValue(value, { from, autoAdd, asInitial }));

    // Keep the queue alive even if this call rejects, so the next call can still run
    this._setValueQueue = result.catch(() => {});

    return result;
  }

  private async _doSetValue(
    value: any[],
    { from = 0, autoAdd = true, asInitial }: { from?: number; autoAdd?: boolean; asInitial?: boolean } = {}
  ) {
    if (!Array.isArray(value)) {
      this.throw(__DEV__ ? 'Collection value must be an array' : '1');
    }

    const groups = this.groups.slice(from);

    await Promise.all(
      value
        .slice(0, autoAdd ? value.length : groups.length)
        .map(async (groupValue: Record<string, any>, index: number) => {
          let group = groups[index];

          if (!group) {
            group = await this.addGroup({ value: groupValue });
          } else {
            await group.setValue(groupValue, { asInitial });
          }
        })
    );

    return this.value;
  }

  async addGroup(options?: CollectionAddGroupOptions) {
    const element = this.hook.roll<CollectionHook, 'collection.addGroup'>('collection.addGroup', {
      params: { options }
    });

    await this.addElement(element, options);

    return element;
  }

  async removeGroup(target: CollectionElementInstance<any> | number) {
    const element = this.hook.roll<CollectionHook, 'collection.removeGroup'>('collection.removeGroup', {
      params: { target }
    });

    const removed = await this.removeElement(element as CollectionElementInstance<any>);

    return removed;
  }
}

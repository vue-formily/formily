import { isEqual } from '@vue-formily/util';

import {
  ElementInstance,
  ContainerAddElementOptions,
  ContainerInternalData,
  ContainerSchema,
  ContainerReactiveData,
  EventPayload,
  ContainerConfig
} from '@/types';
import { isElementsValid } from '@/helpers';
import { addItem, removeItem } from '@/utils';
import { Element } from '@/core/elements/Element';

export abstract class Container<
  S extends ContainerSchema<any> = ContainerSchema<any>,
  C extends ContainerConfig<any> = ContainerConfig<any>,
  I extends ContainerInternalData<S, C> = ContainerInternalData<S, C>,
  R extends ContainerReactiveData = ContainerReactiveData
> extends Element<S, C, I, R> {
  elements: ElementInstance<S>[] = [];

  /**
   * Stores cleanup functions (off handlers) for each managed element,
   * keyed by a WeakMap to avoid memory leaks from strong references.
   */
  private _elementCleanups = new WeakMap<ElementInstance, () => void>();

  shake({ cascade = true }: { cascade?: boolean } = {}) {
    super.shake();

    if (cascade) {
      this.elements.forEach(element => element.shake());
    }
  }

  get valid(): boolean {
    return super.valid && isElementsValid(this as any);
  }

  get dirty() {
    return this.elements.some(element => element.dirty);
  }

  async reset() {
    this.cleanUp();

    await Promise.all(this.elements.map(async (item: any) => await item.reset()));
  }

  async clear() {
    this.cleanUp();

    await Promise.all(this.elements.map(async (item: any) => await item.clear()));
  }

  async addElement<T extends ElementInstance>(element: T, options?: ContainerAddElementOptions) {
    return new Promise<T>(resolve => {
      addItem(this.elements, element, options);

      // Store named handler references so we can cleanly remove only OUR listeners
      // in removeElement, without touching user-defined handlers on the element.
      const onValidated = () => {
        this.emit('elementValidated', { element });
      };
      const onUpdated = async (event: EventPayload) => {
        this.emit('elementUpdated', { element });

        await this.validate({ cascade: false });

        if (!isEqual(this.value, this.prevValue)) {
          this.emit(event);
        }
      };
      const onChanged = (event: EventPayload) => {
        this.emit('elementChanged', { element });

        if (!isEqual(this.raw, this.prevRaw)) {
          this.emit(event);
        }
      };
      const onCreated = async () => {
        await this.validate({ cascade: false });

        this.emit('elementAdded', { element });

        resolve(element);
      };

      element.on('validated', onValidated).on('updated', onUpdated).on('changed', onChanged).on('created', onCreated);

      // Register cleanup: removes only the handlers we added above
      this._elementCleanups.set(element as ElementInstance, () => {
        element.off('validated', onValidated).off('updated', onUpdated).off('changed', onChanged);
        // 'created' is a one-shot event already consumed; no need to off
      });
    });
  }

  async removeElement<T extends ElementInstance>(target: T): Promise<T | undefined> {
    const element = removeItem(this.elements, target, { key: 'formId' });

    if (element) {
      // Cleanup only the listeners WE registered, preserving user-defined handlers
      const cleanup = this._elementCleanups.get(element as ElementInstance);
      cleanup?.();
      this._elementCleanups.delete(element as ElementInstance);

      await this.validate({ cascade: false });

      this.emit('elementRemoved', { element });
    }

    return element as T;
  }

  async validate({ cascade = true }: { cascade?: boolean } = {}) {
    this.emit('validate', { value: this.raw });

    if (cascade) {
      await Promise.all(this.elements.map(async (group: any) => await group.validate()));
    }

    await this.validation.validate(this._d.value, this.props);

    this.emit('validated', { value: this.value });

    return this.valid as boolean;
  }
}

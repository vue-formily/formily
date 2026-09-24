import { isEmpty, merge } from '@vue-formily/util';
import {
  ConfigParam,
  ElementConfig,
  ElementEvents,
  ElementHook,
  ElementInstance,
  ElementInternalData,
  ElementOptions,
  ElementReactiveData,
  ElementSchema,
  ValidationEvents
} from '@/types';
import { cloneValue, mergeConfigs } from '@/helpers';
import { ELEMENT_TYPES } from '@/constants';
import { ELEMENT_HOOKS } from '@/hooks/element';
import { Validation } from '@/core/validations';
import { Schemy } from '@/core/Schemy';

/**
 * The base class for all form elements (Field, Group, Collection, etc.).
 * It extends Schemy and provides core functionality for state management,
 * validation, and hierarchy traversal (parent/ancestors).
 *
 * The class uses four generic types:
 * S: Schema Type
 * C: Config Type (including 'parent')
 * I: Internal Data Type (_d)
 * R: Reactive Data Type (_r)
 */
export abstract class Element<
  S extends ElementSchema = ElementSchema,
  C extends ElementConfig = ElementConfig,
  I extends ElementInternalData<S, C> = ElementInternalData<S, C>,
  R extends ElementReactiveData = ElementReactiveData
> extends Schemy<S, C, I, R> {
  /**
   * Static property to define the form type of the element.
   */
  static FORM_TYPE = ELEMENT_TYPES.ELEMENT as string;

  /**
   * Abstract method that must be implemented by concrete classes (e.g., Field)
   * to handle setting the raw value, often involving type conversion/normalization.
   */
  abstract setRaw(value: any): any;

  /**
   * The validation instance responsible for running configured rules.
   */
  validation: Validation;

  constructor(schema: S, config?: ConfigParam<ElementConfig>) {
    super(schema, config);

    const { _d, _r } = this;
    const { rules = [] } = schema;
    const { reactor, plugs, validation } = this.config;

    // Initialize the Validation instance, passing the element itself as context
    this.validation = new Validation({ rules }, [
      {
        reactor,
        plugs,
        context: this as ElementInstance
      },
      validation
    ]);

    // 1. 'input': Triggered when the element's raw input changes.
    this.on<ElementEvents, 'input'>('input', ({ detail }) => {
      _d.prevRaw = cloneValue(this.raw);

      // Run 'element.raw' hook to allow plugs to modify the raw value before storage
      const newRaw = this.hook.roll<ElementHook, 'element.raw'>('element.raw', {
        value: detail.value
      });

      _r.set('raw', newRaw);
    });

    // 2. 'validate': Triggered when validation starts (usually after input/blur).
    this.on<ElementEvents, 'validate'>('validate', ({ detail }) => {
      _d.prevValue = cloneValue(this.value);
      // Run 'element.value' hook to allow transformation/normalization of the value
      _d.value = this.hook.roll<ElementHook, 'element.value'>('element.value', {
        value: detail.value
      });
    });

    // 3. 'validated': Triggered after validation completes.
    this.validation.on<ValidationEvents, 'validated'>('validated', () => {
      // Update the reactive value only if the element is currently valid
      _r.set('value', this.valid ? _d.value : null);
    });
  }

  get defaultConfig(): ElementConfig {
    return mergeConfigs([
      super.defaultConfig,
      {
        hooks: ELEMENT_HOOKS
      }
    ]);
  }

  /**
   * Retrieves the parent element instance (Type P from ElementConfig<P>).
   */
  get parent() {
    return this.config.parent;
  }

  /**
   * Computes an array of all ancestor elements, from the highest level down to the immediate parent.
   */
  get ancestors() {
    const parent = this.parent;

    return parent ? [...parent.ancestors, parent] : [];
  }

  /**
   * Indicates if the element has been 'shaken' (had user interaction or validation triggered).
   */
  get shaken() {
    return this._r.get('shaken');
  }

  /**
   * Indicates if validation is currently running asynchronously.
   */
  get pending() {
    return this.validation.pending;
  }

  /**
   * Gets the model name for the element, defaulting to the formId if 'model' is not provided in schema.
   */
  get model() {
    return this.schema.model || this.formId;
  }

  /**
   * The current raw input value.
   */
  get raw() {
    return this._r.get('raw');
  }

  /**
   * The previously stored raw input value.
   */
  get prevRaw() {
    return this._d.prevRaw;
  }

  /**
   * The processed/validated value for the model. Returns null if not valid.
   */
  get value() {
    return this.valid ? this._r.get('value') : null;
  }

  /**
   * The previously stored processed value.
   */
  get prevValue() {
    return this._d.prevValue;
  }

  /**
   * The options/metadata defined in the internal data.
   */
  get options(): ElementOptions {
    return this._d.options;
  }

  /**
   * Gets the error message to display.
   * Priority: invalidated message (string) > Validation error > null.
   */
  get error() {
    const { shaken, invalidated } = this._r.value as ElementReactiveData;
    const { errors } = this.validation;

    // If not shaken (no interaction) or currently valid, hide the error.
    if (!shaken || this.valid) {
      return null;
    }

    return invalidated || errors[0] || null;
  }

  /**
   * Unique identifier for the element's form context.
   */
  get formId(): string {
    return this._d.rawSchema.formId;
  }

  /**
   * Computes the HTML 'name' attribute value via a hook.
   */
  get htmlName() {
    return this.hook.roll<ElementHook, 'element.htmlName'>('element.htmlName');
  }

  /**
   * Checks if the element is valid (not internally invalidated AND passed validation rules).
   */
  get valid() {
    return isEmpty(this.invalidated) && this.validation.valid;
  }

  /**
   * Gets the internal invalidation message. Returns an empty string if valid.
   * This is used as the high-priority error message.
   */
  get invalidated() {
    return this._r.get('invalidated');
  }

  /**
   * Gets the form type from the schema.
   */
  get formType() {
    return this.schema.formType as S['formType'];
  }

  /**
   * Marks the element as 'shaken', typically revealing validation errors.
   */
  shake() {
    this._r.set('shaken', true);
  }

  cleanUp() {
    this._r.set('shaken', false);
    this._r.set('invalidated', '');
  }

  /**
   * Manually sets an internal invalidation message, overriding rule validation errors.
   * Requires a non-empty string message.
   *
   * @param message - The error message to set for invalidation.
   */
  invalidate(message: string) {
    this._r.set('invalidated', message);
  }

  /**
   * Throws an exception, merging the current formId into the metadata.
   *
   * @param message - The exception message.
   * @param meta - Additional metadata to merge.
   */
  throw(message: string, meta?: Record<string, any>) {
    const { formId } = this;

    super.throw(
      message,
      merge(
        {
          formId
        },
        meta
      )
    );
  }
}

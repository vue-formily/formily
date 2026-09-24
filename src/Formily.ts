import { FormConfig, FormSchema, VueFormilyConfig } from './types';
import { Form } from './core/elements/Form';
import { FormInstance } from './types/instances';
import { mergeConfigs } from './helpers';
import { Collection, Field, Group } from './core/elements';
import { createVueReactor } from './vueReactor';

/**
 * The core class of Vue Formily.
 * It serves as a central registry for form instances and holds the global configuration.
 */
export default class Formily {
  /**
   * Registry of active form instances.
   */
  forms: Record<string, FormInstance<any>>;
  /**
   * Global configuration applied to all forms.
   * This acts as the "Single Source of Truth" for shared settings.
   */
  config: VueFormilyConfig;

  /**
   * Initializes a new Formily instance.
   *
   * @param forms - Initial record of forms (optional).
   * @param config - The global configuration object.
   */
  constructor(forms: Record<string, FormInstance<any>> = {}, config?: VueFormilyConfig) {
    const elements = [Field, Form, Group, Collection];

    this.config = mergeConfigs<VueFormilyConfig>([
      {
        alias: 'forms',
        elements,
        reactor: createVueReactor
      },
      config
    ]);

    this.forms = forms;
  }

  /**
   * Creates and registers a new form instance.
   *
   * @template S - The literal type of the Form Schema.
   * @param schema - The schema defining the form structure.
   * @param config - Optional configuration specific to this form instance (overrides global config).
   * @returns The created Form instance.
   */
  addForm<const F extends FormSchema>(schema: F, config?: FormConfig): FormInstance<F> {
    const formConfig = { ...this.config };

    delete formConfig.alias;

    const form = new Form(schema, [formConfig, config]) as unknown as FormInstance<F>;

    this.forms[form.formId] = form;

    return form;
  }

  /**
   * Removes a form instance from the registry.
   * @param formId - The ID of the form to remove.
   */
  removeForm(formId: string) {
    delete this.forms[formId];
  }

  /**
   * Retrieves a form instance by its ID.
   *
   * @template S - The Schema type of the form (optional for better typing).
   * @param formId - The ID of the form to retrieve.
   * @returns The Form instance cast to the specific schema type.
   */
  getForm<F>(formId: string): F {
    return this.forms[formId] as F;
  }
}

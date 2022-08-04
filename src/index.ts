import { App, ComponentInternalInstance, getCurrentInstance } from 'vue';
import { Field, Group, Collection, Form } from './core/elements';
import { VueFormilyConfig, VueFormilyPlugin } from './types';
import { FormInstance } from './core/elements/instanceTypes';
import Formily, { VueFormilyOptions } from './Formily';
import Objeto from './core/Objeto';
import Evento from './core/Evento';
import { def, logMessage, throwFormilyError } from './utils';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $formily: Formily;
    forms: Record<string, FormInstance>;
  }
}

const _configs = new WeakMap();
const simpleApp = {
  set(context: Record<string, any>, prop: string, value: any) {
    context[prop] = value;
  },
  delete(context: Record<string, any>, prop: string) {
    delete context[prop];
  }
};

function createFormily() {
  const config = {
    app: simpleApp,
    plugs: {},
    elements: []
  } as VueFormilyConfig;
  const elements = config.elements;
  const proto = Objeto.prototype;

  def(proto, '_config', {
    get() {
      return _configs.get(vueFormily);
    }
  });

  def(proto, 'plugs', {
    get() {
      return this._config.plugs;
    }
  });

  const vueFormily = {
    install(app: App, options: VueFormilyOptions = {}) {
      // initialize default form elements
      [Field, Collection, Group].forEach(F => this.register(F, options));

      app.mixin({
        beforeCreate(this: any) {
          this.$formily = new Formily(options, this.$root);
        },
        data(this: any) {
          const alias = this.$formily.options.alias;
          let forms = this.$root[alias];

          if (!forms) {
            forms = this.$root[alias] = {};
          }

          return {
            [alias]: forms
          };
        }
      });
    },
    plug(plugin: VueFormilyPlugin, ...args: any[]) {
      plugin.install(config, ...args);
    },
    register(F: any, ...args: any[]) {
      if (!elements.includes(F)) {
        elements.unshift(F);
      }

      F.register(...args);
    }
  };

  _configs.set(vueFormily, config);

  return vueFormily;
}

export function useFormily(options: VueFormilyOptions = {}) {
  const instance: ComponentInternalInstance | null = getCurrentInstance();

  if (instance == null) {
    throwFormilyError(logMessage('Must be called at the top of a `setup` function'));
  }

  const $root = instance.proxy && instance.proxy.$root;

  if (!$root) {
    throwFormilyError(logMessage('Unexpected error'));
  }

  return options ? $root.$formily : new Formily(options, $root);
}

const VueFormily = {
  createFormily
};

export type { VueFormilyOptions };
export type { VueFormilyConfig, VueFormilyPlugin, Localizer } from './types';
export type {
  ElementOptions,
  ElementSchema,
  ElementsSchemas,
  GroupSchema,
  CollectionSchema,
  FormSchema,
  FieldType,
  FieldValue,
  Format,
  FieldSchema,
  ReadonlySchema
} from './core/elements/types';
export type {
  ElementInstance,
  CustomValidationProperty,
  CascadeRule,
  CustomVariationProperties,
  CustomGroupProperty,
  CustomGroupProperties,
  FieldInstance,
  GroupInstance,
  FormInstance,
  CollectionInstance,
  CollectionItemInstance
} from './core/elements/instanceTypes';
export type { Validator, RuleSchema, ValidationRuleSchema } from './core/validations/types';
export type { EventHandler, EventOptions, EventElement } from './core/Evento';

export * from './core/validations';
export { Field, Group, Collection, Form, Objeto, Formily, Evento };
export { defineSchema } from './defineSchema';
export { createFormily, VueFormily };
export default VueFormily;

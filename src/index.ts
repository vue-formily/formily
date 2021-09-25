import { App } from 'vue';
import { Field, Group, Collection, Form } from './core/elements';
import { VueFormilyConfig, VueFormilyPlugin } from './types';
import { FormInstance } from './core/elements/instanceTypes';
import Formily, { VueFormilyOptions } from './Formily';
import Objeto from './core/Objeto';
import { def } from './utils';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $formily: Formily;
    forms: Record<string, FormInstance>;
  }
}

const _configs = new WeakMap();

function createFormily() {
  const config = {
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

          return {
            [alias]: this.$root === this ? {} : this.$root[alias]
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

const VueFormily = {
  createFormily
};

export * from './types';
export * from './core/elements/types';
export * from './core/elements/instanceTypes';
export * from './core/validations/types';

export * from './core/validations';
export { Field, Group, Collection, Form, Objeto, Formily };
export { defineSchema } from './defineSchema';
export { createFormily, VueFormily };
export default VueFormily;

import { App, ComponentInternalInstance, getCurrentInstance, reactive } from 'vue';

import { VueFormilyConfig } from './types';
import { FormInstance } from './types/instances';
import Formily from './Formily';
import { createFormilyError } from './utils';
import { mergeConfigs } from './helpers';

declare module 'vue' {
  interface ComponentCustomProperties {
    $formily: Formily;
    forms: Record<string, FormInstance<any>>;
  }
}

function createFormily(config: Partial<VueFormilyConfig> = {}) {
  return {
    install(app: App, appConfig: Partial<VueFormilyConfig> = {}) {
      const formily = new Formily(reactive({}), mergeConfigs([config, appConfig]));

      app.config.globalProperties.$formily = formily;

      app.mixin({
        beforeCreate() {
          this.$formily = formily;
        },
        computed: {
          [formily.config.alias as string]() {
            return this.$formily.forms;
          }
        }
      });
    }
  };
}

export function useFormily() {
  const instance: ComponentInternalInstance | null = getCurrentInstance();

  if (instance == null) {
    throw createFormilyError('Must be called at the top of a `setup` function');
  }

  return instance.appContext.config.globalProperties.$formily;
}

const VueFormily = {
  createFormily
};

// export type { VueFormilyOptions };
export type * from './types';
export * from './core/validations';
export * from './core/elements';
export * from './defineSchema';
export { createFormily, VueFormily };

export default VueFormily;

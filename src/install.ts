import { VueConstructor } from 'vue';
import { VueFormilyOptions, VueFormilyPlugin } from './types';
import { Field, Group, Collection } from './core/elements';
import Formily from './Formily';
import { register } from './helpers';
import plug from './plug';
import { readonlyDumpProp } from './utils';

export default function install(Vue: VueConstructor, options: VueFormilyOptions = {}) {
  if (Vue.prototype.$formily) {
    return;
  }

  const { elements = [], plugins = [], ..._options } = options;

  plugins.forEach((plugin: VueFormilyPlugin) => plug(plugin));

  // initialize default form elements
  [Group, Collection, Field, ...elements].forEach(F => register(F, _options));

  Vue.mixin({
    beforeCreate(this: any) {
      readonlyDumpProp(this, '$formily', new Formily(_options, this));
    },
    data(this: any) {
      return {
        [this.$formily.options.alias as string]: {}
      };
    }
  });
}

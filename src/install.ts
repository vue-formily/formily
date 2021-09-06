import { VueConstructor } from 'vue';
import { VueFormilyOptions } from './types';
import { Field, Group, Collection } from './core/elements';
import Formily from './Formily';
import { register } from './helpers';
import { readonlyDumpProp } from './utils';

export default function install(Vue: VueConstructor, options: VueFormilyOptions = {}) {
  if (Vue.prototype.$formily) {
    return;
  }

  const { elements = [], ..._options } = options;

  // initialize default form elements
  [...elements, Group, Collection, Field].forEach(F => register(F, _options));

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

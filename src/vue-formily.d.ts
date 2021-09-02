import { Form } from './core/elements';
import Formily from './Formily';

declare module 'vue/types/vue' {
  interface Vue {
    readonly $formily: Formily;
    forms: Record<string, Form>;
  }
}

import { Form } from './core/elements';
import Formily from './Formily';
import { Plugs } from './types';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $formily: Formily;
    forms: Record<string, Form>;
  }
}

declare module '.' {
  export interface Objeto {
    plugs: Plugs;
  }
}

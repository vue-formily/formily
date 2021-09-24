import { reactive } from 'vue';
import Evento from './Evento';

export default class Objeto extends Evento {
  protected _d: any = reactive({});
  readonly _config?: Record<string, any>;
}

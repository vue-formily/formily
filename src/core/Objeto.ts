import { reactive } from 'vue';
import Evento from './Evento';
import { Plugs } from './plugs';

export default class Objeto extends Evento {
  protected _d: any = reactive({});
  readonly _config?: Record<string, any>;
  readonly plugs?: Plugs;
}

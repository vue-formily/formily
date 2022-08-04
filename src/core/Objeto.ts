import { reactive } from 'vue';
import Evento from './Evento';
import { Plugs } from './plugs';
import { formatter, Format } from '../helpers/formatter';

export default class Objeto extends Evento {
  protected _d: Record<string, any> = {
    r: reactive({})
  };

  protected readonly _config?: Record<string, any>;
  readonly plugs?: Plugs;
  format(format: string | Format | null | undefined, type: string, ...args: any[]) {
    return formatter(format, type, this, ...args);
  }
}

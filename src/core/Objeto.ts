import Evento from './Evento';

export default class Objeto extends Evento {
  protected _d: any = {};

  [key: string]: any;
}

import Evento from './Evento';

export default abstract class Objeto extends Evento {
  protected _d: any = {};

  [key: string]: any;
}

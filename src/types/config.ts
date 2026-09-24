import { GenericEchoEvents, NormalizedEchoEvents } from './events';
import { Hook } from './hook';
import { Plug } from './plug';
import { ReactorFactory } from './reactor';

export type SharedConfig = {
  on?: GenericEchoEvents;
  once?: GenericEchoEvents;
  hooks?: Hook[];
  reactor?: ReactorFactory;
  plugs?: Plug[];
};

export type ConfigParam<C> = C | undefined | ConfigParam<C>[];

export type NormalizedConfig<T> = Omit<T, 'on' | 'once'> & {
  on: NormalizedEchoEvents;
  once: NormalizedEchoEvents;
};

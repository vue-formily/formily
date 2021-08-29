import { VueFormilyPlugin } from './types';
import Objeto from './core/Objeto';

export default function plug(plugin: VueFormilyPlugin, ...args: any[]) {
  plugin.install(Objeto, ...args);
}

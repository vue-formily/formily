import { Plugs } from './core/plugs';

export type VueFormilyConfig = {
  plugs: Plugs;
  elements: any[];
};

export interface VueFormilyPlugin {
  install(config: VueFormilyConfig, ...args: any[]): any;
}

export type Localizer = (value: string, props?: Record<string, any>, data?: Record<string, any>) => string;

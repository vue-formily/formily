import { FormInstance } from './core/elements/instanceTypes';
import { Plugs } from './core/plugs';
import Formily from './Formily';

export type VueFormilyConfig = {
  plugs: Plugs;
  elements: any[];
};

export type SchemaValidation = {
  valid: boolean;
  reason?: string;
  infos?: Record<string, string>;
};

export interface VueFormilyPlugin {
  install(config: VueFormilyConfig, ...args: any[]): any;
}

export type Localizer = (value: string, props?: Record<string, any>, data?: Record<string, any>) => string;

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $formily: Formily;
    forms: Record<string, FormInstance>;
  }
}

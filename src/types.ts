import { ElementOptions } from './core/elements/types';
import { ValidationRuleSchema } from './core/validations/types';

export type VueFormilyConfig = {
  plugs: Plugs;
  elements: any[];
};

export type SchemaValidation = {
  valid: boolean;
  reason?: string;
  infos?: Record<string, string>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Plugs {}

export interface VueFormilyPlugin {
  install(config: VueFormilyConfig, ...args: any[]): any;
}

export type VueFormilyOptions = ElementOptions & {
  rules?: ValidationRuleSchema[];
  alias?: string;
};

export type Localizer = (value: string, props?: Record<string, any>, data?: Record<string, any>) => string;

export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export type Builtin = Primitive | FunctionConstructor | Date | Error | RegExp;

export type ReadonlySchema<T> = T extends Builtin
  ? T
  : T extends Array<any>
  ? Readonly<T>
  : T extends Record<string, any>
  ? { readonly [K in keyof T]: ReadonlySchema<T[K]> }
  : Readonly<T>;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

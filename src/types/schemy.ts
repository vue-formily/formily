import { SharedConfig } from './config';
import { SchemyEvents } from './instanceEvents';
import { EchoEvents, GenericEchoEvents } from './events';
import { Hook } from './hook';

export type SchemyProps = Record<PropertyKey, any>;

export type SchemyConfig = SharedConfig;

export type SchemySchema<E extends EchoEvents = SchemyEvents> = {
  props?: SchemyProps;
  on?: GenericEchoEvents<E>;
  once?: GenericEchoEvents<E>;
  hooks?: Hook[];
};

export type SchemyReactiveData = {
  data: Record<PropertyKey, any>;
  props: SchemyProps;
};

export type SchemyInternalData<S extends SchemySchema = SchemySchema, C extends SchemyConfig = SchemyConfig> = {
  rawSchema: S;
  rawConfig: C;
  config: C;
};

import { SchemyInstance } from './instances';

export type Plug<T extends SchemyInstance = SchemyInstance> = (instance: T) => any;

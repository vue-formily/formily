import { SharedConfig } from './config';
import { GroupConfig, GroupScopes } from './elements';
import { Plug } from './plug';
import { ReactorFactory } from './reactor';

export type VueFormilyConfig = {
  elements?: GroupConfig['elements'];
  reactor?: ReactorFactory;
  plugs?: Plug[];
  shared?: SharedConfig;
  alias?: string;
} & GroupScopes & {
    group?: GroupConfig;
  };

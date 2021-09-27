// defineSchema is a utility that is primarily used for type inference
// when declaring form schemas. Type inference is provided in the component
// options (provided as the argument). The returned value has artificial types
// for TSX / manual render function / IDE support.

import { ElementsSchemas, ReadonlySchema } from './core/elements/types';
import { ValidationRuleSchema } from './core/validations/types';

export function defineSchema<V extends string, F extends ReadonlySchema<ElementsSchemas<V> | ValidationRuleSchema<V>>>(
  schema: F
): F {
  return schema;
}

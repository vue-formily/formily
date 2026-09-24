import { Validation } from '@/core/validations';
import { ElementInstance, ElementSchema } from '@/types';

export function createElementValidation(schema: ElementSchema, config: any, instance: ElementInstance) {
  const { rules = [] } = schema;
  const { reactor, plugs, validation } = config;

  return new Validation({ rules }, [
    {
      reactor,
      plugs,
      context: instance
    },
    validation
  ]);
}

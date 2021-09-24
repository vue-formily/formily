import { ReadonlySchema } from '../../types';
import { FormInstance } from './instanceTypes';
import { FormSchema } from './types';
import Group from './Group';

export default class Form extends Group {
  static create<F extends ReadonlySchema<FormSchema>>(schema: F) {
    return (new Form((schema as unknown) as FormSchema) as unknown) as FormInstance<F>;
  }
}

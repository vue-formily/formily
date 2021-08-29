import { isEmpty, isNumeric } from '@vue-formily/util';

export const numeric = {
  validator: (value: any) => isNumeric(value),
  name: 'numeric'
};

export const required = {
  validator: (value: any) => !isEmpty(value),
  name: 'required'
};

import { isEmpty, isNumeric } from '@vue-formily/util';

export const numeric = {
  validator: (value: any) => isEmpty(value) || isNumeric(value),
  name: 'numeric'
} as const;

export const required = {
  validator: (value: any) => {
    return !isEmpty(value);
  },
  name: 'required'
} as const;

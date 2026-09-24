import { isPlainObject, merge } from '@vue-formily/util';

export function cloneValue(value: any) {
  if (isPlainObject(value)) {
    return merge({}, value);
  } else if (Array.isArray(value)) {
    return merge([], value);
  }

  return value;
}

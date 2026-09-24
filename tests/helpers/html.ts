import { VueWrapper } from '@vue/test-utils';

export function getContent(wrapper: VueWrapper, selector: string) {
  return wrapper.find(selector).element.innerHTML;
}

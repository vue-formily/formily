import { ContainerInstance } from '@/types';

export function genEnumValue(container: ContainerInstance, { prop = 'value' }: { prop?: string } = {}) {
  const value = {} as Record<PropertyKey, any>;

  container.elements.forEach(element => {
    value[element.formId] = (element as any)[prop];
  });

  return value;
}

export function isElementsValid(container: ContainerInstance) {
  return !container.elements.some(({ valid }) => !valid);
}

export const FIELD_DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date'
} as const;

export const ELEMENT_DATA_TYPES = {
  ...FIELD_DATA_TYPES
} as const;

export const ELEMENT_TYPES = {
  ELEMENT: 'element',
  COLLECTION: 'collection',
  GROUP: 'group',
  FORM: 'form',
  FIELD: 'field'
} as const;

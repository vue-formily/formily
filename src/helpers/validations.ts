import { isFunction } from '@vue-formily/util';
import { ValidationRuleSchema } from '../core/validations/types';
import { SchemaValidation } from '../types';

export function normalizeRules(rules: ValidationRuleSchema[] = [], type: string | null = null) {
  const _rules: ValidationRuleSchema[] = [];

  rules.forEach((rule: ValidationRuleSchema) => {
    /**
     * Only apply validation rule to 'function' or 'undefined' or field that has type is included in 'types' property of the rule
     */
    if (isFunction(rule) || !rule.for || (type && rule.for.includes(type))) {
      _rules.push(rule);
    }
  });

  return _rules as ValidationRuleSchema[];
}

export function invalidateSchemaValidation(sv: SchemaValidation, reason?: string, infos?: Record<string, string>) {
  sv.valid = false;
  sv.reason = reason;
  sv.infos = infos;
}

export function getSchemaAcceptance(schema: any, type: string) {
  const sv = { valid: false };
  const i: {
    accepted: boolean;
    sv: SchemaValidation;
  } = {
    accepted: false,
    sv
  };

  if ('_is' in schema) {
    i.accepted = true;

    if (schema._is === type) {
      sv.valid = true;
    }
  } else {
    sv.valid = true;
  }

  return i;
}

export function acceptSchema(schema: any, type: string) {
  schema._is = type;
}

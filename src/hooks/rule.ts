import { merge } from '@vue-formily/util';
import { RuleHook } from '@/types/hooks';

export const RULE_HOOKS = [
  {
    name: 'rule',
    handlers: {
      validatorProps(payload) {
        const { context: rule } = payload;

        payload.value = merge({}, rule.props, payload.value);

        return payload;
      },
      message(payload) {
        return payload;
      }
    }
  } as RuleHook
];

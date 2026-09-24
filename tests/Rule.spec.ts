import { Rule } from '@/core/validations';
import { numeric } from './helpers/rules';
import { getContent } from './helpers';
import flushPromises from 'flush-promises';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { createFormily, defineSchema, FormInstance } from '@/index';

describe('Rule', () => {
  const rule = new Rule(numeric);

  it('Validate successfully', async () => {
    expect(await rule.validate(4)).toBe(true);
    expect(await rule.validate('4a')).toBe(false);
  });

  it('Can set message dynamically', async () => {
    await rule.validate('4a');

    expect(rule.error).toBe(undefined);

    rule.setMessage('Value is not a number');
    await rule.validate('4a');

    expect(rule.error).toBe('Value is not a number');
  });

  it('should trigger UI updates when rule state changes', async () => {
    // 1. Setup Formily instance
    const formily = createFormily();

    // 2. Define Schema containing a field with rules
    // This ensures the Rule is created and managed by the Reactor
    const schema = defineSchema({
      formId: 'ruleTestForm',
      formType: 'group',
      fields: [
        {
          formId: 'age',
          formType: 'field',
          value: null,
          rules: [
            {
              ...numeric,
              message: 'Value must be a number' // Default error message
            }
          ]
        }
      ]
    });

    type TestForm = FormInstance<typeof schema>;

    // 3. Mount a Dummy Component to simulate the View Layer
    const wrapper = mount(
      {
        render() {
          // Access the form and the specific field
          const form = (this as any).$formily.getForm('ruleTestForm');

          if (!form) return null;

          const field = form.$age;
          // Access the reactive Rule instance created by Formily
          const rule = field.validation.numeric as Rule;

          if (!rule) return h('div', 'No Rule Found');

          // Render different outputs based on the test step
          // This proves that accessing .valid or .error triggers dependency tracking
          return h('div', { id: 'output' }, [
            // Luôn luôn render valid status
            h('div', { class: 'status' }, `Valid: ${rule.valid}`),

            // Luôn luôn render error (nếu không có lỗi thì nó là chuỗi rỗng)
            h('div', { class: 'error' }, rule.error || '')
          ]);
        }
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    // 4. Initialize the Form
    wrapper.vm.$formily.addForm(schema);
    await flushPromises();

    // Lấy instance
    const form = wrapper.vm.forms.ruleTestForm as unknown as TestForm;
    const field = form.$age;

    // --- CASE 1: Initial ---
    // Error rỗng, Valid true
    expect(getContent(wrapper, '.status')).toBe('Valid: true');
    expect(getContent(wrapper, '.error')).toBe('');

    // --- CASE 2: Validate Fail ---
    await field.setValue('abc');
    await flushPromises();

    expect(getContent(wrapper, '.status')).toBe('Valid: false');
    expect(getContent(wrapper, '.error')).toBe('Value must be a number');

    // --- CASE 3: Dynamic Message ---
    field.validation.numeric.setMessage('New dynamic error');
    await flushPromises();

    expect(getContent(wrapper, '.error')).toBe('New dynamic error');
  });
});

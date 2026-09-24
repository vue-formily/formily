import flushPromises from 'flush-promises';
import { Field } from '@/core/elements';
import { numeric, required } from './helpers/rules';
import { createFormily, defineSchema, FieldInstance, FieldSchema, FormInstance } from '@/index';
import { getContent } from './helpers';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { defineField } from '@/defineSchema';

function createField<const F extends FieldSchema>(schema: F) {
  return new Field(schema as unknown as FieldSchema) as unknown as FieldInstance<F>;
}

describe('Field', () => {
  it('Can cast', async () => {
    const f1 = createField({
      formId: 'field_name',
      formType: 'field',
      type: 'number',
      value: '1'
    });
    const f2 = createField({
      formId: 'field_name',
      formType: 'field',
      type: 'string',
      value: 123
    });
    const f3 = createField({
      formId: 'field_name',
      formType: 'field',
      type: 'boolean',
      value: 'true'
    });
    const f4 = createField({
      formId: 'field_name',
      formType: 'field',
      type: 'date',
      value: '2020/12/3'
    });

    await flushPromises();

    expect(f1.value).toBe(1);
    expect(f2.value).toBe('123');
    expect(f3.value).toBe(true);
    expect(f3.checked).toBe(true);
    expect(f4.value).toBeInstanceOf(Date);

    const date = new Date();

    f1.raw = '3';
    f2.setValue(date);
    f3.raw = 'aaa';
    f4.setValue(date);

    await flushPromises();

    expect(f1.value).toBe(3);
    expect(typeof f2.value).toBe('string');
    expect(f3.value).toBe(false);
    expect(f3.checked).toBe(false);
    expect(f4.value).toBeInstanceOf(Date);

    f1.raw = '3a';
    f4.raw = 'abc';

    await flushPromises();

    expect(f1.value).toBe(NaN);
    expect(f1.valid).toBe(true);
    expect(f4.value?.toString()).toBe('Invalid Date');
    expect(f4.valid).toBe(true);
  });

  it('Can override default rules', async () => {
    const s = defineField({
      formId: 'field_name',
      formType: 'field',
      type: 'number'
    });
    const f = createField(s);

    f.validation.addRule({
      ...numeric,
      message: 'test message'
    });

    await f.setValue('1a');

    expect(f.value).toBe(null);
    expect(f.valid).toBe(false);
    expect((f.validation as any).numeric.error).toBe('test message');
  });

  it('Can be shaken', async () => {
    const f = createField({
      formId: 'field_name',
      formType: 'field',
      rules: [
        {
          name: 'test',
          validator: () => false,
          message: 'test message'
        }
      ]
    });

    await flushPromises();

    expect(f.value).toBe(null);
    expect(f.valid).toBe(false);
    expect(f.error).toBe(null);

    f.shake();

    expect(f.error).toBe('test message');
  });

  it('Can reset', async () => {
    const f = createField({
      formId: 'field_name',
      formType: 'field',
      value: 'test',
      rules: [
        {
          name: 'test',
          validator: () => false,
          message: 'test message'
        }
      ]
    });
    const f2 = createField({
      formId: 'field_name',
      formType: 'field',
      value: 'test'
    });

    await flushPromises();

    f.shake();
    f2.shake();

    expect(f.error).toBe('test message');
    expect(f2.error).toBe(null);

    await f.reset();
    await f2.reset();

    expect(f.error).toBe(null);
    expect(f.validation.errors?.length).toBe(1);
    expect(f.raw).toBe('test');
    expect(f2.error).toBe(null);
    expect(f2.validation.errors?.length).toBe(0);
  });

  it('Can clean up', async () => {
    const f = createField({
      formId: 'field_name',
      formType: 'field',
      value: '',
      rules: [
        {
          ...required,
          message: 'abc'
        }
      ]
    });

    await flushPromises();

    f.shake();

    expect(f.valid).toBe(false);
    expect(f.error).not.toBe('');

    f.cleanUp();

    expect(f.valid).toBe(false);
    expect(f.error).toBe(null);
  });

  it('Can clear', async () => {
    const f = createField({
      formId: 'field_name',
      formType: 'field',
      value: '',
      rules: [
        {
          ...required,
          message: 'abc'
        }
      ]
    });
    const f2 = createField({
      formId: 'field_name',
      formType: 'field',
      default: 'test',
      rules: [
        {
          ...required,
          message: 'abc'
        }
      ]
    });

    await flushPromises();

    f.shake();

    expect(f.valid).toBe(false);
    expect(typeof f.error).toBe('string');

    await f.clear();

    expect(f.valid).toBe(false);
    expect(f.error).toBe(null);
    expect(f.validation.errors).toBeInstanceOf(Array);
    expect(f.raw).toBe('');

    await f2.setValue('');
    expect(f2.valid).toBe(false);

    await f2.clear();
    expect(f2.valid).toBe(true);
  });

  it('Should has checked property', async () => {
    const f = createField({
      formId: 'field_name',
      formType: 'field',
      checkedValue: 'test'
    });

    expect(f.checked).toBe(false);

    f.raw = 'test';

    await flushPromises();

    expect(f.checked).toBe(true);
  });

  it('Can invalidate', async () => {
    const f = createField({
      formId: 'field_name',
      formType: 'field',
      checkedValue: 'test'
    });

    await flushPromises();

    expect(f.valid).toBe(true);

    f.invalidate('invalid test');
    f.shake();

    expect(f.valid).toBe(false);
    expect(f.error).toBe('invalid test');

    await f.reset();

    expect(f.valid).toBe(true);
    expect(f.error).toBe(null);

    f.invalidate('test');
    f.shake();

    expect(f.valid).toBe(false);
    expect(f.error).toBe('test');
  });

  it('should be clean (dirty=false) upon initialization', async () => {
    const field = createField({
      formId: 'username',
      formType: 'field',
      value: 'admin'
    });

    await flushPromises();

    expect(field.value).toBe('admin');
    expect(field.dirty).toBe(false);
  });

  it('should become dirty when value changes', async () => {
    const field = createField({
      formId: 'username',
      formType: 'field',
      value: 'admin'
    });

    await flushPromises();

    await field.setValue('user');

    expect(field.value).toBe('user');
    expect(field.dirty).toBe(true);
  });

  it('should become clean if value reverts to initial value', async () => {
    const field = createField({
      formId: 'username',
      formType: 'field',
      value: 'admin'
    });

    await flushPromises();

    // Change value -> dirty
    await field.setValue('user');

    expect(field.dirty).toBe(true);

    // Revert value -> clean
    await field.setValue('admin');
    expect(field.dirty).toBe(false);
  });

  it('should handle "reset()" correctly', async () => {
    const field = createField({
      formId: 'count',
      formType: 'field',
      value: 10
    });

    await flushPromises();

    await field.setValue(20);
    expect(field.dirty).toBe(true);

    await field.reset();

    expect(field.value).toBe('10');
    expect(field.dirty).toBe(false);
  });

  it('should update initial value when "asInitial" is used', async () => {
    const field = createField({
      formId: 'city',
      formType: 'field',
      value: 'Hanoi'
    });

    await flushPromises();

    await field.setValue('Danang');
    expect(field.dirty).toBe(true);

    await field.setValue('HoChiMinh', { asInitial: true });

    expect(field.value).toBe('HoChiMinh');
    expect(field.dirty).toBe(false);

    await field.setValue('Hanoi');
    expect(field.dirty).toBe(true);
  });

  it('should handle Default value correctly', async () => {
    const field = createField({
      formId: 'role',
      formType: 'field',
      default: 'guest'
    });

    await flushPromises();

    expect(field.value).toBe('guest');
    expect(field.dirty).toBe(false);

    await field.setValue('admin');
    expect(field.dirty).toBe(true);
  });

  it('should update UI reactively when value, raw, or validation state changes', async () => {
    // 1. Setup Formily
    const formily = createFormily();

    // 2. Define Schema
    // We create a field with a default value and a simple validation rule
    const schema = defineSchema({
      formId: 'testForm',
      formType: 'group',
      fields: [
        {
          formId: 'username',
          formType: 'field',
          default: 'guest',
          rules: [
            {
              name: 'test',
              // Simple rule: Fails if value equals 'invalid_user'
              validator: (val: any) => val !== 'invalid_user',
              message: 'Username is invalid'
            }
          ]
        }
      ]
    });

    type TestForm = FormInstance<typeof schema>;

    // 3. Mount Component with "Render All" strategy
    const wrapper = mount(
      {
        render() {
          const form = (this as any).$formily.getForm('testForm');

          if (!form) return null;

          const field = form.$username;

          // Render all reactive properties to ensure Vue tracks dependencies
          return h('div', { id: 'field-debug' }, [
            // Use JSON.stringify for safe value checking (handles types)
            h('div', { id: 'value' }, JSON.stringify(field.value)),
            h('div', { id: 'raw' }, String(field.raw)),
            h('div', { id: 'valid' }, String(field.valid)),
            h('div', { id: 'error' }, field.error)
          ]);
        }
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    // Initialize the form
    wrapper.vm.$formily.addForm(schema) as unknown as TestForm;
    await flushPromises();

    // Retrieve field instance
    const form = wrapper.vm.forms.testForm as unknown as TestForm;
    const field = form.$username;

    // --- CASE 1: Initial State (Default Value) ---
    // Expect default value 'guest' to be rendered
    expect(JSON.parse(getContent(wrapper, '#value'))).toBe('guest');
    expect(getContent(wrapper, '#raw')).toBe('guest');
    expect(getContent(wrapper, '#valid')).toBe('true');
    expect(getContent(wrapper, '#error')).toBe('');

    // --- CASE 2: Set Value (Valid Input) ---
    await field.setValue('admin');
    await flushPromises(); // Wait for Vue DOM update

    // UI should reflect the new valid value
    expect(JSON.parse(getContent(wrapper, '#value'))).toBe('admin');
    expect(getContent(wrapper, '#raw')).toBe('admin');
    expect(field.value).toBe('admin');

    // --- CASE 3: Validation Error (Reactivity) ---
    // Trigger validation failure
    await field.setValue('invalid_user');

    field.shake();

    await flushPromises();

    expect(JSON.parse(getContent(wrapper, '#value'))).toBe(null);

    expect(getContent(wrapper, '#raw')).toBe('invalid_user');

    // 3. Validation State
    expect(getContent(wrapper, '#valid')).toBe('false'); // Valid state flips to false
    expect(getContent(wrapper, '#error')).toBe('Username is invalid'); // Error message appears

    // --- CASE 4: Clear (Empty State) ---
    // Clear sets the raw value to default string
    await field.clear();
    await flushPromises();

    expect(JSON.parse(getContent(wrapper, '#value'))).toBe('guest');
    expect(getContent(wrapper, '#raw')).toBe('guest');
    // Valid should be true (unless 'required' rule exists)
    expect(getContent(wrapper, '#valid')).toBe('true');
    expect(getContent(wrapper, '#error')).toBe('');

    // --- CASE 5: Reset (Back to Default) ---
    // Reset restores the value defined in schema.default
    await field.reset();
    await flushPromises();

    expect(JSON.parse(getContent(wrapper, '#value'))).toBe('guest');
    expect(getContent(wrapper, '#raw')).toBe('guest');
  });
});

import { h } from 'vue';
import { vi } from 'vitest';
import flushPromises from 'flush-promises';
import { mount } from '@vue/test-utils';

import { createFormily, defineSchema, GroupSchema } from '@/index';
import { Collection, Field, Group } from '@/core/elements';
import { getContent, required } from './helpers';
import { FormInstance, GroupInstance, RuleInstance } from '@/types';
import { defineGroup } from '@/defineSchema';

function createGroup<const F extends GroupSchema>(schema: F) {
  return new Group(schema as unknown as GroupSchema, {
    elements: [Field, Collection, Group]
  }) as unknown as GroupInstance<F>;
}

describe('Group', () => {
  it('Throw error with undefined `fields`', () => {
    expect(function () {
      // @ts-expect-error test
      createGroup({ formId: 'group_test' });
    }).toThrowError('[vue-formily] (formId: "group_test") `fields` must be an array.');
  });

  it('Should emit created after setting value', () => {
    const schema = defineGroup({
      formId: 'group_test',
      value: {
        a: 'test'
      },
      on: {
        created() {
          expect(this.value).toEqual({
            a: 'test'
          });
        }
      },
      fields: [
        {
          formId: 'a',
          formType: 'field',
          rules: [
            {
              ...required,
              message: 'abc'
            }
          ]
        }
      ]
    });

    createGroup(schema);
  });

  it('Can access field from index signature', async () => {
    const schema = defineSchema({
      formId: 'group_test',
      formType: 'group',
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      fields: [
        {
          formId: 'a',
          formType: 'field',
          rules: [
            {
              ...required,
              message: 'abc'
            }
          ]
        }
      ]
    });
    const group = createGroup(schema);

    await flushPromises();

    expect(group).toHaveProperty('$a');
    expect(group.$a).toBeInstanceOf(Field);
  });

  it('Can validate', async () => {
    const group = createGroup(
      defineSchema({
        formId: 'group_test',
        formType: 'group',
        rules: [
          {
            ...required,
            message: 'test'
          }
        ],
        fields: [
          {
            formId: 'a',
            formType: 'field',
            rules: [
              {
                ...required,
                message: 'abc'
              }
            ]
          }
        ]
      })
    );

    await flushPromises();

    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.$a.error).toBe('abc');

    await group.reset();

    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.$a.valid).toBe(false);
  });

  it('Can shake', async () => {
    const group = createGroup(
      defineSchema({
        formId: 'group_test',
        formType: 'group',
        rules: [
          {
            ...required,
            message: 'test'
          }
        ],
        fields: [
          {
            formId: 'a',
            formType: 'field',
            rules: [
              {
                ...required,
                message: 'abc'
              }
            ]
          }
        ]
      })
    );

    await flushPromises();

    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.$a.error).toBe('abc');

    await group.reset();

    await group.validate();

    group.shake({ cascade: false });

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.$a.error).toBe(null);
  });

  it('Can reset', async () => {
    const group = createGroup(
      defineSchema({
        formId: 'group_test',
        formType: 'group',
        rules: [
          {
            ...required,
            message: 'test'
          }
        ],
        fields: [
          {
            formId: 'a',
            formType: 'field',
            rules: [
              {
                ...required,
                message: 'abc'
              }
            ]
          }
        ]
      })
    );
    const group2 = createGroup(
      defineSchema({
        formId: 'group_test',
        formType: 'group',
        fields: [
          {
            formId: 'a',
            formType: 'field'
          }
        ]
      })
    );

    expect(group.valid).toBe(true);
    expect(group2.valid).toBe(true);

    await flushPromises();

    await group.validate();
    await group2.validate();

    expect(group.valid).toBe(false);
    expect(group2.valid).toBe(true);

    group.$a.shake();
    group2.$a.shake();

    expect(group.$a.valid).toBe(false);
    expect(group.$a.error).toBe('abc');
    expect(group2.$a.valid).toBe(true);
    expect(group2.$a.error).toBe(null);

    await group.reset();
    await group2.reset();

    expect(group.valid).toBe(false);
    expect(group.$a.valid).toBe(false);
    expect(group2.valid).toBe(true);
    expect(group2.$a.valid).toBe(true);
  });

  it('Can invalidate', async () => {
    const group = createGroup(
      defineSchema({
        formId: 'group_test',
        formType: 'group',
        rules: [
          {
            ...required,
            message: 'test'
          }
        ],
        fields: [
          {
            formId: 'a',
            formType: 'field',
            rules: [
              {
                ...required,
                message: 'abc'
              }
            ]
          }
        ]
      })
    );

    await flushPromises();

    group.$a.setProps({
      test: true
    });

    // set value to pass required rule
    await group.$a.setValue('test');

    group.$a.validation.addRule({
      name: 'test',
      validator(this: RuleInstance) {
        return this.context?.context?.props.test;
      },
      message: 'invalid field'
    });

    expect(group.valid).toBe(true);
    expect(group.error).toBe(null);

    // make the rule to false
    group.$a.setProps({
      test: false
    });

    // trigger update
    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.$a.error).toBe('invalid field');
  });

  it('Can set value', async () => {
    const s = defineSchema({
      formId: 'group_test',
      formType: 'group',
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      fields: [
        {
          formId: 'a',
          formType: 'field',
          rules: [
            {
              ...required,
              message: 'abc'
            }
          ]
        },
        {
          formId: 'b',
          formType: 'group',
          fields: [
            {
              formId: 'c',
              formType: 'field'
            }
          ]
        }
      ]
    });

    type T = GroupInstance<typeof s>;

    const group = createGroup(s) as T;

    await flushPromises();

    expect(group.value).toBe(null);
    await expect(group.setValue('test' as any)).rejects.toThrow();

    await group.setValue({
      a: 'test',
      b: {
        c: 'abc'
      }
    });

    expect(group.value).toEqual({
      a: 'test',
      b: {
        c: 'abc'
      }
    });
    expect(group.$a.value).toBe('test');
    expect(group.$b.$c.value).toBe('abc');

    await group.$a.setValue('hello');
    await flushPromises();

    expect(group.value).toEqual({
      a: 'hello',
      b: {
        c: 'abc'
      }
    });
  });

  it('Can clear', async () => {
    const s = defineSchema({
      formId: 'group_test',
      formType: 'group',
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      fields: [
        {
          formId: 'a',
          formType: 'field',
          rules: [
            {
              ...required,
              message: 'abc'
            }
          ]
        },
        {
          formId: 'b',
          formType: 'field',
          fields: [
            {
              formId: 'c'
            }
          ]
        }
      ]
    });

    const group = createGroup(s);

    await flushPromises();

    await group.validate();

    group.$a.shake();

    expect(group.$a.valid).toBe(false);
    expect(group.$a.error).toBe('abc');

    await group.clear();

    expect(group.valid).toBe(false);
    expect(group.value).toBe(null);
    expect(group.$a.raw).toBe('');
    expect(group.$a.value).toBe(null);
  });

  it('Can add field', async () => {
    const group = createGroup({
      formId: 'group_test',
      formType: 'group',
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      fields: [
        {
          formId: 'a',
          formType: 'field'
        }
      ]
    });

    await flushPromises();

    await group.addField({
      formId: 'b',
      formType: 'field',
      value: 'bbb'
    });
    await group.addField({
      formType: 'field',
      formId: 'c',
      value: 'c'
    });
    await group.addField(
      {
        formType: 'field',
        formId: 'd',
        value: 'd'
      },
      {
        at: 1
      }
    );

    expect((group as any).$b).toBeInstanceOf(Field);
    expect(group.fields.length).toBe(4);
    expect(group.fields[1].formId).toBe('d');
    expect((group as any).$b.value).toBe('bbb');

    expect(group.value).toEqual({
      a: '',
      b: 'bbb',
      c: 'c',
      d: 'd'
    });

    await expect(
      group.addField({
        formType: 'field',
        formId: 'b'
      })
    ).rejects.toThrow();
  });

  it('Can remove field', async () => {
    const group = createGroup({
      formId: 'group_test',
      formType: 'group',
      fields: [
        {
          formType: 'field',
          formId: 'a',
          value: 'a'
        }
      ]
    });

    await flushPromises();

    await group.addField({
      formType: 'field',
      formId: 'b',
      value: 'b'
    });
    await group.addField({
      formType: 'field',
      formId: 'c',
      value: 'c'
    });
    await group.addField(
      {
        formType: 'field',
        formId: 'd',
        value: 'd'
      },
      {
        at: 1
      }
    );

    await group.removeField('c');
    await group.removeField(group.fields[0]);

    expect(group.fields.length).toBe(2);
    expect((group as any).$c).toBe(undefined);
    expect((group as any).$a).toBe(undefined);
    expect((group as any).value).toEqual({
      b: 'b',
      d: 'd'
    });
  });

  it('Can listen', async () => {
    const group = createGroup({
      formId: 'group_test',
      formType: 'group',
      fields: [
        {
          formType: 'field',
          formId: 'a',
          value: 'a'
        }
      ]
    });

    group
      .on('changed', async (value: any, old: any, g: any) => {
        expect(old).toEqual(null);
        expect(value).toEqual({ a: 'a' });
        expect(g.value).toEqual({ a: 'a' });
      })
      .on('fieldChanged', async (_value: any, _old: any, f: any) => {
        expect(f.value).toEqual('a');
      });
  });

  it('Can Invalidate', async () => {
    const group = createGroup({
      formId: 'group_test',
      formType: 'group',
      fields: [
        {
          formType: 'field',
          formId: 'a',
          value: 'a'
        }
      ]
    });

    await flushPromises();

    group.invalidate('test');

    group.shake();

    expect(group.value).toBe(null);
    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');

    await group.reset();

    (group as any).$a.invalidate('test');

    group.shake();

    expect(group.value).toBe(null);
    expect(group.valid).toBe(false);
    expect(group.error).toBe(null);
    expect((group as any).$a.valid).toBe(false);
    expect((group as any).$a.error).toBe('test');
  });

  it('Can trigger changed correctly', async () => {
    const group = createGroup({
      formId: 'group_test',
      formType: 'group',
      fields: [
        {
          formType: 'field',
          formId: 'a'
        }
      ]
    });

    group.on('changed', async (value: any, old: any) => {
      expect(old).toEqual(null);
      expect(value).toEqual({
        a: ''
      });
    });

    const group2 = createGroup({
      formId: 'group_test',
      formType: 'group',
      fields: [
        {
          formType: 'field',
          formId: 'a',
          rules: [required]
        }
      ]
    });

    let count = 0;
    group2.on('changed', async () => {
      count++;
    });

    await flushPromises();

    expect(count).toEqual(0);
  });

  it('Should be clean (dirty=false) upon initialization', async () => {
    const group = createGroup({
      formId: 'group_dirty_test',
      formType: 'group',
      fields: [
        {
          formId: 'a',
          formType: 'field',
          value: 'initial'
        }
      ]
    });

    await flushPromises();

    expect(group.dirty).toBe(false);
    expect(group.$a.dirty).toBe(false);
  });

  it('Should become dirty if a child field becomes dirty', async () => {
    const group = createGroup({
      formId: 'group_dirty_test',
      formType: 'group',
      fields: [
        {
          formId: 'a',
          formType: 'field',
          value: 'initial'
        }
      ]
    });

    await flushPromises();

    // Change child value
    await group.$a.setValue('changed');

    expect(group.$a.dirty).toBe(true);
    expect(group.dirty).toBe(true);
  });

  it('Should return to clean if child reverts to initial value', async () => {
    const group = createGroup({
      formId: 'group_dirty_test',
      formType: 'group',
      fields: [
        {
          formId: 'a',
          formType: 'field',
          value: 'initial'
        }
      ]
    });

    await flushPromises();

    // Make dirty
    await group.$a.setValue('changed');
    expect(group.dirty).toBe(true);

    // Revert to initial
    await group.$a.setValue('initial');
    expect(group.$a.dirty).toBe(false);
    expect(group.dirty).toBe(false);
  });

  it('Should remain dirty if one child is clean but another is dirty', async () => {
    const group = createGroup({
      formId: 'group_dirty_test',
      formType: 'group',
      fields: [
        { formId: 'a', formType: 'field', value: 'A' },
        { formId: 'b', formType: 'field', value: 'B' }
      ]
    });

    await flushPromises();

    // Change A -> Dirty
    await group.$a.setValue('A_Changed');
    expect(group.dirty).toBe(true);

    // Change B -> Dirty
    await group.$b.setValue('B_Changed');
    expect(group.dirty).toBe(true);

    // Revert A -> Clean
    await group.$a.setValue('A');
    expect(group.$a.dirty).toBe(false);

    // Group should still be dirty because B is dirty
    expect(group.dirty).toBe(true);

    // Revert B -> Clean
    await group.$b.setValue('B');
    expect(group.dirty).toBe(false);
  });

  it('Should handle setValue with { asInitial: true }', async () => {
    const group = createGroup({
      formId: 'group_dirty_test',
      formType: 'group',
      fields: [{ formId: 'a', formType: 'field', value: 'old' }]
    });

    await flushPromises();

    // Update value and set as new initial point
    await group.setValue({ a: 'new' }, { asInitial: true });

    expect(group.value).toEqual({ a: 'new' });

    // Should be clean because we updated the initial snapshot
    expect(group.dirty).toBe(false);
    expect(group.$a.dirty).toBe(false);

    // If we revert to the *old* value, it should now be dirty
    await group.setValue({ a: 'old' });
    expect(group.dirty).toBe(true);
  });

  it('Should be clean after reset()', async () => {
    const group = createGroup({
      formId: 'group_dirty_test',
      formType: 'group',
      fields: [{ formId: 'a', formType: 'field', value: 'initial' }]
    });

    await flushPromises();

    // Make dirty
    await group.setValue({ a: 'changed' });
    expect(group.dirty).toBe(true);

    // Reset
    await group.reset();

    expect(group.value).toEqual({ a: 'initial' });
    expect(group.dirty).toBe(false);
  });

  it('Should propagate dirty state correctly in Nested Groups', async () => {
    // Structure: Root -> ChildGroup -> Field
    const group = createGroup({
      formId: 'root',
      formType: 'group',
      fields: [
        {
          formId: 'childGroup',
          formType: 'group',
          fields: [
            {
              formId: 'leaf',
              formType: 'field',
              value: 'initial'
            }
          ]
        }
      ]
    });

    await flushPromises();

    const childGroup = group.$childGroup;
    const leafField = group.$childGroup.$leaf;

    expect(group.dirty).toBe(false);

    // Change the deepest field
    await leafField.setValue('changed');

    expect(leafField.dirty).toBe(true);
    expect(childGroup.dirty).toBe(true); // Parent should be dirty
    expect(group.dirty).toBe(true); // Grandparent should be dirty
  });

  it('Reactivity: should automatically update UI when adding/removing fields', async () => {
    // 1. Setup Formily
    const formily = createFormily();

    // 2. Define initial schema
    const schema = defineSchema({
      formId: 'test',
      formType: 'group',
      fields: [
        {
          formId: 'a',
          formType: 'field'
        }
      ]
    });

    type TestForm = FormInstance<typeof schema>;

    // 3. Mount Component
    // Strategy: Render the actual state (field list & value).
    // This ensures Vue tracks the 'fields' array dependency.
    const wrapper = mount(
      {
        render() {
          const form = (this as any).$formily.getForm('test');

          if (!form) return null;

          return h('div', { id: 'test' }, [
            // Render the count of fields
            h('div', { id: 'count' }, `Count: ${form.fields.length}`),

            // Render the list of formIds.
            // This map function creates the dependency on the 'fields' array.
            h('div', { id: 'ids' }, form.fields.map((f: any) => f.formId).join(', ')),

            // Render the current form value to check data binding
            h('div', { id: 'value' }, JSON.stringify(form.value))
          ]);
        }
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    // Initialize form
    wrapper.vm.$formily.addForm(schema);
    await flushPromises();

    const testForm = wrapper.vm.forms.test as unknown as TestForm;

    // --- CASE 1: Initial State ---
    // Should have 1 field 'a'
    expect(getContent(wrapper, '#count')).toBe('Count: 1');
    expect(getContent(wrapper, '#ids')).toBe('a');

    // --- CASE 2: Add Fields & Set Value ---

    // Add field 'b' (appended to end)
    await testForm.addField({
      formId: 'b',
      formType: 'field'
    });

    // Add group 'c' (inserted at index 0)
    const cField = await testForm.addField(
      {
        formId: 'c',
        formType: 'group',
        fields: [
          {
            formId: 'd',
            formType: 'field'
          }
        ]
      },
      {
        at: 0
      }
    );

    // Set form values
    const value = {
      a: '1',
      b: '2',
      c: {
        d: '2'
      }
    };

    await testForm.setValue(value);
    await flushPromises(); // Wait for Vue to re-render

    // Assertions:
    // 1. Count should be 3
    expect(getContent(wrapper, '#count')).toBe('Count: 3');

    // 2. Order should be c (index 0), a (original), b (appended)
    expect(getContent(wrapper, '#ids')).toBe('c, a, b');

    // 3. Value should match
    const domValue = JSON.parse(getContent(wrapper, '#value'));
    expect(domValue).toEqual(value);

    // 4. Verify internal model consistency
    expect(testForm.fields[0].formId).toBe('c');
    expect(testForm.value).toEqual(value);

    // --- CASE 3: Remove Fields ---

    await testForm.removeField('b');
    await testForm.removeField(cField); // Remove by instance
    await flushPromises();

    // Assertions:
    // Should revert to having only field 'a'
    expect(getContent(wrapper, '#count')).toBe('Count: 1');
    expect(getContent(wrapper, '#ids')).toBe('a');
    expect(testForm.value).toEqual({
      a: '1'
    });
  });

  it('should call both config `on` handler and schema `on` handler (additive, not override)', async () => {
    const configHandler = vi.fn();
    const schemaHandler = vi.fn();

    const group = new Group(
      defineGroup({
        formId: 'test',
        fields: [{ formId: 'a', formType: 'field', value: '1' }],
        on: { updated: schemaHandler }
      }) as any,
      {
        elements: [Field, Group, Collection],
        on: { updated: configHandler }
      }
    );

    await flushPromises();

    // Change field value to trigger 'updated' event on the group
    await (group as any).$a.setValue('changed');
    await flushPromises();

    // Both handlers must be called — neither should override the other
    expect(configHandler).toHaveBeenCalled();
    expect(schemaHandler).toHaveBeenCalled();
  });
});

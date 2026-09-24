import flushPromises from 'flush-promises';
import { vi } from 'vitest';
import { CollectionInstance, CollectionSchema, createFormily, defineSchema, FormInstance } from '@/index';
import { Collection, Field, Group } from '@/core/elements';
import { required } from './helpers/rules';
import { ELEMENT_TYPES } from '@/constants';
import { getContent } from './helpers';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { defineCollection } from '@/defineSchema';

function createCollection<const F extends CollectionSchema>(schema: F) {
  return new Collection(schema as unknown as CollectionSchema, {
    [ELEMENT_TYPES.GROUP]: {
      elements: [Field, Collection, Group]
    }
  }) as unknown as CollectionInstance<F>;
}

describe('Collection', () => {
  const schema = { formId: 'collection_test', formType: 'collection' } as const;

  it('Throw error with invalid schema', () => {
    expect(function () {
      // @ts-expect-error test
      createCollection(schema);
    }).toThrowError('[vue-formily] (formId: "collection_test") `group` must be an object');
  });

  it('Can initialize with default value', async () => {
    const s = defineSchema({
      ...schema,
      value: [{ a: 'init' }], // Data passed directly in schema
      group: {
        fields: [{ formId: 'a', formType: 'field' }]
      }
    });

    const collection = createCollection(s);
    await flushPromises();

    expect(collection.groups.length).toBe(1);
    expect(collection.value).toEqual([{ a: 'init' }]);
  });

  it('Can control autoAdd in setValue', async () => {
    const s = defineSchema({
      ...schema,
      group: {
        fields: [{ formId: 'a', formType: 'field' }]
      }
    });
    const collection = createCollection(s);
    await flushPromises();

    // Add 1 group initially
    await collection.addGroup();

    // Try to set 2 items but disable autoAdd
    await collection.setValue([{ a: 'update_1' }, { a: 'ignore_me' }], { autoAdd: false });

    // Should update the first one, but NOT add the second one
    expect(collection.groups.length).toBe(1);
    expect(collection.value).toEqual([{ a: 'update_1' }]);
  });

  it('Can add group', async () => {
    const s = defineSchema({
      ...schema,
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    const collection = createCollection(s);

    await flushPromises();

    expect(collection.groups).toBeInstanceOf(Array);

    await collection.addGroup();

    expect(collection.groups?.length).toBe(1);

    const group = await collection.addGroup();
    await group.setValue({
      a: 'test'
    });

    expect(collection.groups?.length).toBe(2);
    expect((collection.groups as any)[1].$a).toBeInstanceOf(Field);
    expect((collection.groups as any)[1].$a.value).toBe('test');
  });

  it('Can remove group', async () => {
    const s = defineSchema({
      ...schema,
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    const collection = createCollection(s);

    let group = await collection.addGroup();

    await group.setValue({
      a: 'test',
      formtype: 'field'
    });

    collection.removeGroup(0);

    group = await collection.addGroup();

    await group.setValue({
      a: 'test',
      formtype: 'field'
    });

    await collection.removeGroup(group);

    collection.on('validated', () => {
      expect(collection.groups?.length).toBe(0);
      expect(collection.value).toBe(null);

      collection.off('validated');
    });
  });

  it('Can validate', async () => {
    const s = defineSchema({
      ...schema,
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    const collection = createCollection(s);

    collection.addGroup();

    expect(collection.valid).toBe(true);
    expect(collection.error).toBe(null);

    await collection.validate({ cascade: false });

    expect(collection.valid).toBe(false);

    await collection.validate();

    expect((collection.groups as any)[0].valid).toBe(false);
  });

  it('Can shake', async () => {
    const s = defineSchema({
      ...schema,
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    let collection = createCollection<typeof s>(s);

    await flushPromises();

    await collection.addGroup();

    await collection.validate();

    collection.shake();

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');
    expect((collection.groups as any)[0].$a.error).toBe('abc');

    collection = createCollection(s);

    await flushPromises();

    await collection.addGroup();

    await collection.validate();

    collection.shake({ cascade: false });

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');
    expect((collection.groups as any)[0].$a.error).toBe(null);
  });

  it('Can reset', async () => {
    const s = defineSchema({
      ...schema,
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    const collection = createCollection(s);

    await collection.addGroup();

    expect(collection.valid).toBe(false);
    expect((collection.groups as any)[0].$a.valid).toBe(false);
    expect((collection.groups as any)[0].$a.error).toBe(null);

    collection.shake();

    expect((collection.groups as any)[0].$a.valid).toBe(false);
    expect((collection.groups as any)[0].$a.error).toBe('abc');

    await collection.reset();

    expect(collection.valid).toBe(false);
    expect((collection.groups as any)[0].$a.valid).toBe(false);
    expect((collection.groups as any)[0].$a.error).toBe(null);
  });

  it('Can set value', async () => {
    const s = defineCollection({
      formId: 'collection_test',
      formType: 'collection',
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    const collection = createCollection(s);

    await flushPromises();

    expect(collection.value).toBe(null);
    await expect(collection.setValue('test' as any)).rejects.toThrow();

    await collection.setValue([
      {
        a: 'abc'
      },
      {
        a: 'test',
        b: {
          c: 'sss'
        }
      }
    ]);

    expect(collection.groups).toBeInstanceOf(Array);
    expect(collection.groups?.length).toBe(2);
    expect(collection.value).toEqual([
      {
        a: 'abc',
        b: {
          c: ''
        }
      },
      {
        a: 'test',
        b: {
          c: 'sss'
        }
      }
    ]);

    await collection.setValue([{ a: 'eee' }], { from: 1 });

    expect((collection.value as any)[1]).toEqual({
      b: {
        c: 'sss'
      },
      a: 'eee'
    });
  });

  it('Can clear', async () => {
    const s = defineSchema({
      ...schema,
      rules: [
        {
          ...required,
          message: 'test'
        }
      ],
      group: {
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
      }
    });

    const collection = createCollection(s);

    await flushPromises();

    await collection.validate();

    collection.shake();

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');

    await collection.clear();

    expect(collection.valid).toBe(false);
    expect(collection.value).toBe(null);
  });

  it('Can listen', async () => {
    const collection = createCollection(
      defineSchema({
        ...schema,
        value: [
          {
            a: 'a'
          }
        ],
        group: {
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
        }
      })
    );

    // Chúng ta bọc trong Promise để chờ quá trình khởi tạo bất đồng bộ hoàn tất
    await new Promise<void>(resolve => {
      collection
        .on('created', ({ target }) => {
          // 1. Kiểm tra sự kiện created (được emit cuối constructor)
          expect(target).toEqual(collection);
          resolve(); // Kết thúc test case khi đã khởi tạo xong
        })
        .on('updated', () => {
          expect(collection.value).toEqual([{ a: 'a' }]);
        })
        .on('elementAdded', () => {
          expect(collection.groups.length).toBe(1);
        });
    });
  });

  it('Can initialize with default value', async () => {
    const s = defineSchema({
      ...schema,
      value: [{ a: 'init' }], // Data passed directly in schema
      group: {
        fields: [{ formId: 'a', formType: 'field' }]
      }
    });

    const collection = createCollection(s);
    await flushPromises();

    expect(collection.groups.length).toBe(1);
    expect(collection.value).toEqual([{ a: 'init' }]);
  });

  it('Can control autoAdd in setValue', async () => {
    const s = defineSchema({
      ...schema,
      group: {
        fields: [{ formId: 'a', formType: 'field' }]
      }
    });
    const collection = createCollection(s);
    await flushPromises();

    // Add 1 group initially
    await collection.addGroup();

    // Try to set 2 items but disable autoAdd
    await collection.setValue([{ a: 'update_1' }, { a: 'ignore_me' }], { autoAdd: false });

    // Should update the first one, but NOT add the second one
    expect(collection.groups.length).toBe(1);
    expect(collection.value).toEqual([{ a: 'update_1' }]);
  });

  it('Can invalidate', async () => {
    const s = defineSchema({
      ...schema,
      group: {
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
      }
    });

    const collection = createCollection(s);

    await collection.addGroup();

    collection.invalidate('test');

    collection.shake();

    expect(collection.value).toBe(null);
    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');

    await collection.reset();

    (collection as any).groups[0].$a.invalidate('test');

    collection.shake();

    expect(collection.value).toBe(null);
    expect(collection.valid).toBe(false);
    expect(collection.error).toBe(null);
    expect((collection as any).groups[0].$a.valid).toBe(false);
    expect((collection as any).groups[0].$a.error).toBe('test');
  });

  function createDirtyTestCollection() {
    return createCollection({
      formId: 'list',
      formType: 'collection',
      value: [
        { name: 'A' }, // Row 0
        { name: 'B' } // Row 1
      ],
      group: {
        fields: [
          {
            formId: 'name',
            formType: 'field'
          }
        ]
      }
    });
  }

  it('Should be clean (dirty=false) upon initialization', async () => {
    const collection = createDirtyTestCollection();
    await flushPromises();

    expect(collection.dirty).toBe(false);
    // Check specific row
    expect((collection.groups[0] as any).$name.dirty).toBe(false);
  });

  it('Should become dirty if a field inside a group becomes dirty', async () => {
    const collection = createDirtyTestCollection();
    await flushPromises();

    const row0 = collection.groups[0] as any;

    // Change value of Row 0
    await row0.$name.setValue('A_Changed');

    expect(row0.$name.dirty).toBe(true); // Field dirty
    expect(row0.dirty).toBe(true); // Group dirty
    expect(collection.dirty).toBe(true); // Collection dirty
  });

  it('Should return to clean if the dirty field reverts to initial value', async () => {
    const collection = createDirtyTestCollection();
    await flushPromises();

    const row0 = collection.groups[0] as any;

    // Make dirty
    await row0.$name.setValue('Changed');
    expect(collection.dirty).toBe(true);

    // Revert to 'A'
    await row0.$name.setValue('A');

    expect(row0.dirty).toBe(false);
    expect(collection.dirty).toBe(false);
  });

  it('Should remain dirty if one row is clean but another is dirty', async () => {
    const collection = createDirtyTestCollection();
    await flushPromises();

    const row0 = collection.groups[0] as any;
    const row1 = collection.groups[1] as any;

    // Modify Row 0
    await row0.$name.setValue('A_Mod');
    expect(collection.dirty).toBe(true);

    // Modify Row 1
    await row1.$name.setValue('B_Mod');
    expect(collection.dirty).toBe(true);

    // Revert Row 0 -> Clean
    await row0.$name.setValue('A');
    expect(row0.dirty).toBe(false);

    // Collection still dirty because Row 1 is dirty
    expect(collection.dirty).toBe(true);

    // Revert Row 1 -> Clean
    await row1.$name.setValue('B');
    expect(collection.dirty).toBe(false);
  });

  it('Should handle setValue with { asInitial: true }', async () => {
    const collection = createDirtyTestCollection(); // Initial: [{name: 'A'}, {name: 'B'}]
    await flushPromises();

    const newValue = [{ name: 'New_A' }, { name: 'New_B' }];

    // Update value and set as new Initial
    await collection.setValue(newValue, { asInitial: true });

    expect(collection.value).toEqual(newValue);

    // Should be clean
    expect(collection.dirty).toBe(false);

    // Reverting to OLD value ('A') should now make it DIRTY (because initial is now 'New_A')
    const row0 = collection.groups[0] as any;
    await row0.$name.setValue('A');
    expect(collection.dirty).toBe(true);
  });

  it('Should be clean after reset()', async () => {
    const collection = createDirtyTestCollection(); // Initial: [{name: 'A'}, {name: 'B'}]
    await flushPromises();

    // Make dirty
    await collection.setValue([{ name: 'Changed_1' }, { name: 'Changed_2' }]);
    expect(collection.dirty).toBe(true);

    // Reset
    await collection.reset();

    expect(collection.value).toEqual([{ name: 'A' }, { name: 'B' }]);
    expect(collection.dirty).toBe(false);
  });

  it('Should handle partial updates with asInitial', async () => {
    const collection = createDirtyTestCollection(); // Initial: [{name: 'A'}, {name: 'B'}]
    await flushPromises();

    // Update only the 2nd row and make it the new initial for that row
    await collection.setValue([{ name: 'B_NewInitial' }], { from: 1, asInitial: true });

    // Row 0 should still check against 'A'
    // Row 1 should now check against 'B_NewInitial'
    const row1 = collection.groups[1] as any;

    expect(row1.value.name).toBe('B_NewInitial');
    expect(collection.dirty).toBe(false);

    // Modifying Row 1 back to 'B' should make it dirty now
    await row1.$name.setValue('B');
    expect(collection.dirty).toBe(true);
  });

  it('should update UI reactively when adding/removing groups', async () => {
    // 1. Setup
    const formily = createFormily();

    // Define schema with validation rules
    const schema = defineSchema({
      formId: 'rootForm',
      formType: 'group',
      fields: [
        {
          formId: 'userList',
          formType: 'collection',
          rules: [
            {
              name: 'test',
              validator: (val: any[]) => val && val.length > 0,
              message: 'List cannot be empty'
            }
          ],
          group: {
            fields: [
              {
                formId: 'name',
                formType: 'field',
                default: 'New User'
              }
            ]
          }
        }
      ]
    });

    type TestForm = FormInstance<typeof schema>;

    const wrapper = mount(
      {
        render() {
          const root = (this as any).$formily.getForm('rootForm');
          if (!root) return null;
          const collection = root.$userList;

          if (!collection) return h('div', 'Loading...');

          return h('div', { id: 'collection-debug' }, [
            h('div', { id: 'count' }, `Count: ${collection.groups.length}`),
            h('div', { id: 'valid' }, String(collection.valid)),
            h('div', { id: 'error' }, collection.error),

            h(
              'ul',
              { id: 'list' },
              collection.groups.map((group: any, index: number) => {
                return h('li', { class: 'item' }, `${index}:${group.value?.name ?? ''}`);
              })
            )
          ]);
        }
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    // Init Root Form
    wrapper.vm.$formily.addForm(schema);
    await flushPromises();

    const rootForm = wrapper.vm.forms.rootForm as unknown as TestForm;
    const collection = rootForm.$userList as unknown as CollectionInstance<any>;

    // --- CASE 1: Initial State ---
    expect(getContent(wrapper, '#count')).toBe('Count: 0');
    expect(getContent(wrapper, '#valid')).toBe('true');

    // --- CASE 2: Add Group ---
    await collection.addGroup();

    expect(getContent(wrapper, '#count')).toBe('Count: 1');
    expect(getContent(wrapper, '#list')).toContain('0:New User');

    // --- CASE 3: Modify Child Field ---
    await (collection.groups[0] as any).$name.setValue('Alice');
    await flushPromises();

    expect(getContent(wrapper, '#list')).toContain('0:Alice');

    // --- CASE 4: Set Value (Batch) ---
    await collection.setValue([{ name: 'Bob' }, { name: 'Charlie' }]);
    await flushPromises();

    expect(getContent(wrapper, '#count')).toBe('Count: 2');
    expect(getContent(wrapper, '#list')).toContain('0:Bob');
    expect(getContent(wrapper, '#list')).toContain('1:Charlie');

    // --- CASE 5: Validation ---
    await collection.removeGroup(1);
    await collection.removeGroup(0);

    await collection.validate();
    collection.shake();
    await flushPromises();

    expect(getContent(wrapper, '#valid')).toBe('false');
    expect(getContent(wrapper, '#error')).toBe('List cannot be empty');
  });

  it('Concurrent setValue calls should not create duplicate groups', async () => {
    const s = defineSchema({
      ...schema,
      group: { fields: [{ formId: 'a', formType: 'field' }] }
    });
    const collection = createCollection(s);
    await flushPromises();

    // Fire two setValue calls simultaneously — without queuing, both snapshot groups=[]
    // and both would call addGroup for every item → duplicates
    await Promise.all([collection.setValue([{ a: '1' }, { a: '2' }]), collection.setValue([{ a: '3' }, { a: '4' }])]);

    // Should have exactly 2 groups (the second call updates existing ones)
    expect(collection.groups.length).toBe(2);
  });

  it('Removed group should not trigger parent events after removal', async () => {
    const s = defineSchema({
      ...schema,
      group: { fields: [{ formId: 'a', formType: 'field' }] }
    });
    const collection = createCollection(s);
    await flushPromises();

    await collection.addGroup();
    const group = collection.groups[0] as any;

    const elementUpdatedSpy = vi.fn();
    collection.on('elementUpdated', elementUpdatedSpy);

    // Remove the group
    await collection.removeGroup(0);
    expect(collection.groups.length).toBe(0);

    const callCountAfterRemove = elementUpdatedSpy.mock.calls.length;

    // Trigger an event on the removed group — should NOT propagate to collection
    await group.$a.setValue('should not propagate');

    expect(elementUpdatedSpy.mock.calls.length).toBe(callCountAfterRemove);
  });

  it('setValue with `from` option should only update groups from that index onward', async () => {
    const s = defineSchema({
      ...schema,
      group: { fields: [{ formId: 'a', formType: 'field' }] }
    });
    const collection = createCollection(s);
    await flushPromises();

    await collection.setValue([{ a: 'first' }, { a: 'second' }, { a: 'third' }]);
    expect(collection.groups.length).toBe(3);

    // Update only from index 1 onward
    await collection.setValue([{ a: 'updated-second' }, { a: 'updated-third' }], { from: 1 });
    expect(collection.groups.length).toBe(3);
    expect((collection.groups[0] as any).value.a).toBe('first'); // unchanged
    expect((collection.groups[1] as any).value.a).toBe('updated-second');
    expect((collection.groups[2] as any).value.a).toBe('updated-third');
  });
});

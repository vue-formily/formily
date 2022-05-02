/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/valid-title */
import { createFormily, defineSchema } from '@/index';
import { Collection, Field, Group } from '@/core/elements';
import { required } from './helpers/rules';
import flushPromises from 'flush-promises';

const formily = createFormily();

[Field, Collection, Group].forEach(F => formily.register(F));

describe('Collection', () => {
  const schema = { formId: 'collection_test', formType: 'collection' } as const;

  it('Throw error with invalid schema', () => {
    expect(function () {
      // eslint-disable-next-line no-new
      Collection.create(schema as any);
    }).toThrowError('[vue-formily] (formId: "collection_test") `group` must be an object');
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

    const collection = Collection.create(s);

    expect(collection.groups).toBeInstanceOf(Array);

    collection.addGroup();

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

    const collection = Collection.create(s);

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

  it('Can add field', async () => {
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

    const collection = Collection.create(s);

    const group = await collection.addGroup();

    group.addField({
      formId: 'added',
      formType: 'field'
    });

    expect((collection.groups[0] as any).$added).toBeInstanceOf(Field);
  });

  it('Can remove field', async () => {
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

    const collection = Collection.create(s);

    collection.addGroup();
    collection.removeField('a');

    expect((collection.groups[0] as any).$a).toBe(undefined);
  });

  it('Can get schema', async () => {
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

    const collection = Collection.create(s);
    let newSchema = collection.getSchema();

    expect(newSchema).toBe(s);

    collection.addField({
      formId: 'added',
      formType: 'field'
    });

    newSchema = collection.getSchema();

    expect(newSchema).toBe(s);
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

    const collection = Collection.create(s);

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

    let collection = Collection.create<typeof s>(s);

    collection.addGroup();

    await collection.validate();

    collection.shake();

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');
    expect((collection.groups as any)[0].$a.error).toBe('abc');

    collection = Collection.create(s);

    collection.addGroup();

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

    const collection = Collection.create(s);

    collection.addGroup();

    expect(collection.valid).toBe(true);

    await collection.validate();

    expect(collection.valid).toBe(false);

    collection.shake();

    expect((collection.groups as any)[0].$a.valid).toBe(false);
    expect((collection.groups as any)[0].$a.error).toBe('abc');

    collection.reset();

    expect(collection.valid).toBe(true);
    expect((collection.groups as any)[0].$a.valid).toBe(true);
  });

  it('Can set value', async () => {
    const s = defineSchema({
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

    const collection = Collection.create(s);

    expect(collection.value).toBe(null);
    await expect(collection.setValue('test' as any)).rejects.toThrowError();

    const value = [
      {
        a: 'abc'
      },
      {
        a: 'test',
        b: {
          c: 'sss'
        }
      }
    ];

    await collection.setValue(value);

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

    const collection = Collection.create(s);

    await collection.validate();

    collection.shake();

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');

    collection.clear();

    expect(collection.valid).toBe(false);
    expect(collection.value).toBe(null);
  });

  it('Can listen', async () => {
    const s = defineSchema({
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
    });

    const collection = Collection.create(s);
    let o1;
    let v1;
    let c: any;
    let g: any;

    collection
      .on('changed', async (value, old, coll) => {
        o1 = old;
        v1 = value;
        c = coll;
      })
      .on('groupchanged', async (value, old, gr) => {
        g = gr;
      });

    await flushPromises();

    expect(o1).toEqual(null);
    expect(v1).toEqual([{ a: 'a' }]);
    expect(c.value).toEqual([{ a: 'a' }]);
    expect(g.value).toEqual({ a: 'a' });
  });
});

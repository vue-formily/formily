import { Collection, Field, Group } from '@/core/elements';
import { GroupSchema } from '@/core/elements/types';
import { register } from '@/helpers';
import { required } from './helpers/rules';

[Group, Collection, Field].forEach((F: any) => register(F));

describe('Collection', () => {
  const schema: any = { formId: 'collection_test' };

  it('Throw error with invalid schema', () => {
    expect(function () {
      // eslint-disable-next-line no-new
      new Collection(schema);
    }).toThrowError('[vue-formily] (formId: "collection_test") `group` must be an object');
  });

  it('Can add group', async () => {
    schema.rules = [
      {
        ...required,
        message: 'test'
      }
    ];

    schema.group = {
      fields: [
        {
          formId: 'a',
          rules: [
            {
              ...required,
              message: 'abc'
            }
          ]
        }
      ]
    };

    const collection = new Collection(schema);

    expect(collection.groups).toBe(null);

    collection.addGroup();

    expect(collection.groups?.length).toBe(1);

    await collection.addGroup().setValue({
      a: 'test'
    });

    expect(collection.groups?.length).toBe(2);
    expect((collection.groups as any)[1].a).toBeInstanceOf(Field);
    expect((collection.groups as any)[1].a.value).toBe('test');
  });

  it('Can remove group', async () => {
    const collection = new Collection(schema);

    const group = collection.addGroup();

    await group.setValue({
      a: 'test'
    });

    collection.removeGroup(0);

    collection.on('validated', () => {
      expect(collection.groups?.length).toBe(0);
      expect(collection.value).toBe(null);

      collection.off('validated');
    });
  });

  it('Can validate', async () => {
    const collection = new Collection(schema);

    collection.addGroup();

    expect(collection.valid).toBe(true);
    expect(collection.error).toBe(null);

    await collection.validate({ cascade: false });

    expect(collection.valid).toBe(false);

    await collection.validate();

    expect((collection.groups as any)[0].valid).toBe(false);
  });

  it('Can shake', async () => {
    let collection = new Collection(schema);

    collection.addGroup();

    await collection.validate();

    collection.shake();

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');
    expect((collection.groups as any)[0].a.error).toBe('abc');

    collection = new Collection(schema);

    collection.addGroup();

    await collection.validate();

    collection.shake({ cascade: false });

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');
    expect((collection.groups as any)[0].a.error).toBe(null);
  });

  it('Can reset', async () => {
    const collection = new Collection(schema);

    collection.addGroup();

    expect(collection.valid).toBe(true);

    await collection.validate();

    expect(collection.valid).toBe(false);

    collection.shake();

    expect((collection.groups as any)[0].a.valid).toBe(false);
    expect((collection.groups as any)[0].a.error).toBe('abc');

    collection.reset();

    expect(collection.valid).toBe(true);
    expect((collection.groups as any)[0].a.valid).toBe(true);
  });

  it('Can set value', async () => {
    schema.group.fields.push({
      formId: 'b',
      fields: [
        {
          formId: 'c'
        }
      ]
    } as GroupSchema);

    const collection = new Collection(schema);

    expect(collection.value).toBe(null);
    await expect(collection.setValue('test' as any)).rejects.toThrowError();

    const value = [
      {
        a: 'abc'
      },
      {
        b: {
          c: 'sss'
        }
      }
    ];

    await collection.setValue(value);

    expect(collection.groups).toBeInstanceOf(Array);
    expect(collection.groups?.length).toBe(2);
    expect(collection.value).toEqual(value);

    await collection.setValue([{ a: 'eee' }], { from: 1 });

    expect((collection.value as any)[1]).toEqual({
      b: {
        c: 'sss'
      },
      a: 'eee'
    });
  });

  it('Can clear', async () => {
    const collection = new Collection(schema);

    await collection.validate();

    collection.shake();

    expect(collection.valid).toBe(false);
    expect(collection.error).toBe('test');

    collection.clear();

    expect(collection.valid).toBe(false);
    expect(collection.value).toBe(null);
  });
});

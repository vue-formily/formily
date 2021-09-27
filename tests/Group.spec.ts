import { createFormily, defineSchema, GroupSchema, ReadonlySchema, Rule } from '@/index';
import { Collection, Field, Group } from '@/core/elements';
import flushPromises from 'flush-promises';
import { required } from './helpers/rules';
import { GroupInstance } from '@/core/elements/instanceTypes';

const formily = createFormily();

[Field, Collection, Group].forEach(F => formily.register(F));

function createGroup<F extends ReadonlySchema<GroupSchema>>(schema: F) {
  return (new Group((schema as unknown) as GroupSchema) as unknown) as GroupInstance<F>;
}

describe('Group', () => {
  const schema = defineSchema({
    formId: 'group_test',
    rules: [
      {
        ...required,
        message: 'test'
      }
    ],
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
  });

  it('Throw error with undefined `fields`', () => {
    expect(function () {
      // eslint-disable-next-line no-new
      createGroup({ formId: 'group_test' } as any);
    }).toThrowError('[vue-formily] (formId: "group_test") invalid schema, `fields` must be an array.');
  });

  it('Can access field from index signature', () => {
    const group = createGroup(schema);

    expect(group).toHaveProperty('a');
    expect(group.a).toBeInstanceOf(Field);
  });

  it('Can cascade rules', async () => {
    const s = defineSchema({
      formId: 'test',
      rules: [
        {
          ...required,
          cascade: true,
          message: 'test'
        }
      ],
      fields: [
        {
          formId: 'a'
        },
        {
          formId: 'b',
          rules: [
            {
              ...required,
              inherit: false
            }
          ]
        }
      ]
    });

    const group = createGroup(s);

    await flushPromises();

    expect(group.validation.required).toBeInstanceOf(Rule);
    expect(group.a.validation.required).toBeInstanceOf(Rule);
    expect(group.a.validation.required.message).toBe('test');
    expect(group.b.validation.required.valid).toBe(false);
    expect(group.b.validation.required.message).toBe(null);
  });

  it('Can validate', async () => {
    const group = createGroup(schema);

    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.a.error).toBe('abc');

    group.reset();

    await group.validate({ cascade: false });

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.a.valid).toBe(true);
  });

  it('Can shake', async () => {
    const group = createGroup(schema);

    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.a.error).toBe('abc');

    group.reset();

    await group.validate();

    group.shake({ cascade: false });

    expect(group.valid).toBe(false);
    expect(group.error).toBe('test');
    expect(group.a.error).toBe(null);
  });

  it('Can reset', async () => {
    const group = createGroup({
      ...schema,
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
    });

    expect(group.valid).toBe(true);

    await flushPromises();

    await group.validate();

    expect(group.valid).toBe(false);

    group.a.shake();

    expect(group.a.valid).toBe(false);
    expect(group.a.error).toBe('abc');

    group.reset();

    expect(group.valid).toBe(true);
    expect(group.a.valid).toBe(true);
  });

  it('Can invalidate', async () => {
    const group = createGroup(schema);

    group.a.addProps({ test: true });

    // set value to pass required rule
    await group.a.setValue('test');

    group.a.validation.addRule({
      name: 'test',
      validator(_a: any, _b: any, field: Field) {
        return field.props.test;
      },
      message: 'invalid field'
    });

    expect(group.valid).toBe(true);
    expect(group.error).toBe(null);

    // make the rule to false
    group.a.props.test = false;

    // trigger update
    await group.validate();

    group.shake();

    expect(group.valid).toBe(false);
    expect(group.a.error).toBe('invalid field');
  });

  it('Can set value', async () => {
    const s = defineSchema({
      ...schema,
      fields: [
        ...schema.fields,
        {
          formId: 'b',
          fields: [
            {
              formId: 'c'
            }
          ]
        }
      ]
    });

    type T = GroupInstance<typeof s>;

    const group = createGroup(s) as T;

    expect(group.value).toBe(null);
    await expect(group.setValue('test' as any)).rejects.toThrowError();

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
    expect(group.a.value).toBe('test');
    expect(group.b.c.value).toBe('abc');
  });

  it('Can clear', async () => {
    const group = createGroup(schema);

    await group.validate();

    group.a.shake();

    expect(group.a.valid).toBe(false);
    expect(group.a.error).toBe('abc');

    await group.clear();

    expect(group.valid).toBe(false);
    expect(group.value).toBe(null);
    expect(group.a.raw).toBe('');
    expect(group.a.value).toBe(null);
  });
});

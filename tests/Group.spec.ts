import { Rule } from '@/index';
import { Collection, Field, Group } from '@/core/elements';
import { FieldSchema, GroupSchema } from '@/core/elements/types';
import { RuleSchema } from '@/core/validations/types';
import { register } from '@/helpers';
import flushPromises from 'flush-promises';
import { required } from './helpers/rules';

[Group, Collection, Field].forEach((F: any) => register(F));

describe('Group', () => {
  const schema: any = { formId: 'group_test' };

  it('Throw error with undefined `fields`', () => {
    expect(function () {
      // eslint-disable-next-line no-new
      new Group(schema);
    }).toThrowError('[vue-formily] (formId: "group_test") invalid schema, `fields` must be an array.');
  });

  it('Can access field from index signature', () => {
    schema.rules = [
      {
        ...required,
        message: 'test'
      }
    ];

    schema.fields = [
      {
        formId: 'a',
        rules: [
          {
            ...required,
            message: 'abc'
          }
        ]
      } as FieldSchema
    ];

    const group = new Group(schema);

    expect(group).toHaveProperty('a');
    expect(group.a).toBeInstanceOf(Field);
  });

  it('Can cascade rules', () => {
    const group = new Group({
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

    expect(group.a.validation.required).toBeInstanceOf(Rule);
    expect(group.a.validation.required.message).toBe('test');
    expect(group.b.validation.required.message).toBe(null);
  });

  it('Can validate', async () => {
    const group = new Group(schema);

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
    const group = new Group(schema);

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
    schema.fields = [
      {
        formId: 'a',
        rules: [
          {
            ...required,
            message: 'abc'
          }
        ]
      } as FieldSchema
    ];

    const group = new Group(schema);

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
    const group = new Group(schema);

    group.a.addProps({ test: true });

    // set value to pass required rule
    await group.a.setValue('test');

    (group.a as Field).validation.addRule({
      name: 'test',
      validator(_a: any, _b: any, field: Field) {
        return field.props.test;
      },
      message: 'invalid field'
    } as RuleSchema);

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
    schema.fields.push({
      formId: 'b',
      fields: [
        {
          formId: 'c'
        }
      ]
    } as GroupSchema);

    const group = new Group(schema);

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
    const group = new Group(schema);

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

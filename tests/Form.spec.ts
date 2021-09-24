import { createFormily, defineSchema } from '@/index';
import { Form, Field, Collection, Group } from '@/core/elements';
import { CollectionItemInstance, FormInstance } from '@/core/elements/instanceTypes';

const formily = createFormily();

[Field, Collection, Group].forEach(F => formily.register(F));

describe('Form', () => {
  const schema = defineSchema({
    formId: 'form',
    fields: [
      {
        formId: 'a',
        type: 'string'
      },
      {
        formId: 'b',
        group: {
          fields: [
            {
              formId: 'c',
              type: 'string'
            },
            {
              formId: 'd',
              group: {
                fields: [
                  {
                    formId: 'e',
                    type: 'string'
                  },
                  {
                    formId: 'f',
                    type: 'string'
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  });

  type TestForm = FormInstance<typeof schema>;

  const form = Form.create(schema) as TestForm;

  it('Field has correct name', () => {
    expect(form.a.htmlName).toBe('form[a]');
    expect(form.b.htmlName).toBe('form[b][]');
  });

  it('Nested form fields has correct name', () => {
    type C1 = CollectionItemInstance<TestForm['b']>;
    type C2 = CollectionItemInstance<C1['d']>;

    // groups item 1
    const b0 = form.b.addGroup() as C1;

    expect(b0.htmlName).toBe('form[b][0]');
    expect(b0.c.htmlName).toBe('form[b][0][c]');

    const i1d0 = b0.d.addGroup() as C2;

    expect(i1d0.htmlName).toBe('form[b][0][d][0]');
    expect(i1d0.e.htmlName).toBe('form[b][0][d][0][e]');

    // group item 2
    const b2 = form.b.addGroup() as C1;

    expect(b2.htmlName).toBe('form[b][1]');
    expect(b2.d.htmlName).toBe('form[b][1][d][]');

    const b2d0 = b2.d.addGroup();

    expect(b2d0.htmlName).toBe('form[b][1][d][0]');

    const b2d1 = b2.d.addGroup();
    expect(b2d1.htmlName).toBe('form[b][1][d][1]');
  });
});

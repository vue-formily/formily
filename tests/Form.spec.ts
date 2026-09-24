import { defineSchema, FormSchema } from '@/index';
import { Form, Field, Collection, Group } from '@/core/elements';
import { FormInstance } from '@/types/instances';

function createForm<const F extends FormSchema>(schema: F) {
  const elements = [Field, Collection, Group];

  return new Form(schema as unknown as FormSchema, {
    elements
  }) as unknown as FormInstance<F>;
}

describe('Form', () => {
  const schema = defineSchema({
    formId: 'form',
    formType: 'group',
    fields: [
      {
        formId: 'a',
        formType: 'field',
        type: 'string'
      },
      {
        formId: 'b',
        formType: 'collection',
        group: {
          fields: [
            {
              formId: 'c',
              formType: 'field',
              type: 'string'
            },
            {
              formId: 'd',
              formType: 'collection',
              group: {
                fields: [
                  {
                    formId: 'e',
                    formType: 'field',
                    type: 'string'
                  },
                  {
                    formId: 'f',
                    formType: 'field',
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

  const form = createForm(schema);

  it('Field has correct name', () => {
    expect(form.$a.htmlName).toBe('form[a]');
    expect(form.$b.htmlName).toBe('form[b][]');
  });

  it('Nested form fields has correct name', async () => {
    // groups item 1
    const b0 = await form.$b.addGroup();

    expect(b0.htmlName).toBe('form[b][0]');
    expect(b0.$c.htmlName).toBe('form[b][0][c]');

    const i1d0 = await b0.$d.addGroup();

    expect(i1d0.htmlName).toBe('form[b][0][d][0]');
    expect(i1d0.$e.htmlName).toBe('form[b][0][d][0][e]');

    // group item 2
    const b2 = await form.$b.addGroup();

    expect(b2.htmlName).toBe('form[b][1]');
    expect(b2.$d.htmlName).toBe('form[b][1][d][]');

    const b2d0 = await b2.$d.addGroup();

    expect(b2d0.htmlName).toBe('form[b][1][d][0]');

    const b2d1 = await b2.$d.addGroup();
    expect(b2d1.htmlName).toBe('form[b][1][d][1]');
  });
});

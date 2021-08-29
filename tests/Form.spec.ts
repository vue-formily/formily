import { Form, Field, Group, Collection } from '@/core/elements';
import { register } from '@/helpers';

[Field, Group, Collection].forEach(F => register(F));

describe('Form', () => {
  const form = new Form({
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

  it('Should get vm succesfully', () => {
    form.addProps({
      _formy: {
        vm: 'Vue instance'
      }
    });

    expect(form.a.getVm()).toBe('Vue instance');
  });

  it('Field has correct name', () => {
    expect(form.a.htmlName).toBe('form[a]');
    expect(form.b.htmlName).toBe('form[b][]');
  });

  it('Nested form fields has correct name', () => {
    // groups item 1
    const b0 = form.b.addGroup();

    expect(b0.htmlName).toBe('form[b][0]');
    expect(b0.c.htmlName).toBe('form[b][0][c]');

    const i1d0 = b0.d.addGroup();

    expect(i1d0.htmlName).toBe('form[b][0][d][0]');
    expect(i1d0.e.htmlName).toBe('form[b][0][d][0][e]');

    // group item 2
    const b2 = form.b.addGroup();

    expect(b2.htmlName).toBe('form[b][1]');
    expect(b2.d.htmlName).toBe('form[b][1][d][]');

    const b2d0 = b2.d.addGroup();

    expect(b2d0.htmlName).toBe('form[b][1][d][0]');

    const b2d1 = b2.d.addGroup();
    expect(b2d1.htmlName).toBe('form[b][1][d][1]');
  });
});

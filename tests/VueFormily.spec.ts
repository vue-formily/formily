import { h } from 'vue';
import { mount } from '@vue/test-utils';
import stringFormat from '@vue-formily/string-format';
import { createFormily, defineSchema, useFormily } from '@/index';
import { Form } from '@/core/elements';
import flushPromises from 'flush-promises';
import { required } from './helpers/rules';
import { FormInstance } from '@/core/elements/instanceTypes';

describe('VueFormily', () => {
  it('Should install successfully', () => {
    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [createFormily()]
        }
      }
    );

    expect('$formily' in wrapper.vm).toBe(true);
  });

  it('Should `useFormily` successfully', () => {
    const wrapper = mount(
      {
        setup() {
          const formily = useFormily();

          formily.addForm({
            formId: 'form',
            formType: 'group',
            fields: [
              {
                formId: 'a',
                formType: 'field',
                format: 'test'
              }
            ]
          });
        },
        template: '<div></div>'
      },
      {
        global: {
          plugins: [createFormily()]
        }
      }
    );

    expect('$formily' in wrapper.vm).toBe(true);
    expect(wrapper.vm.forms.form).toBeInstanceOf(Form);
  });

  it('Should add form successfully', () => {
    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [createFormily()]
        }
      }
    );

    const form = wrapper.vm.$formily.addForm({
      formId: 'form',
      formType: 'group',
      fields: [
        {
          formId: 'a',
          formType: 'field',
          format: 'test'
        }
      ]
    });

    expect(form).toBeInstanceOf(Form);
    expect('form' in wrapper.vm.forms).toBe(true);
  });

  it('Can change alias', () => {
    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [
            [
              createFormily(),
              {
                alias: 'myForms'
              }
            ]
          ]
        }
      }
    );

    expect('myForms' in wrapper.vm).toBe(true);
  });

  it('Can turn off silent', async () => {
    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [
            [
              createFormily(),
              {
                silent: false
              }
            ]
          ]
        }
      }
    );

    const form = wrapper.vm.$formily.addForm({
      formId: 'form',
      formType: 'group',
      fields: [
        {
          formId: 'a',
          formType: 'field',
          format: 'test',
          rules: [required]
        }
      ]
    });

    await flushPromises();

    expect(form.valid).toBe(true);
  });

  it('Should plug i18n successfully', () => {
    const formily = createFormily();

    formily.plug({
      install(config) {
        (config.plugs as any).stringFormat = {
          format(format: any) {
            return format;
          }
        };
      }
    });
    formily.plug({
      install(config) {
        (config.plugs as any).i18n = {
          translate(format: any, field: any) {
            return `${format} ${field.value}`;
          }
        };
      }
    });

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [
            [
              formily,
              {
                silent: true
              }
            ]
          ]
        }
      }
    );

    const form = wrapper.vm.$formily.addForm(
      defineSchema({
        formId: 'form',
        formType: 'group',
        fields: [
          {
            formId: 'a',
            formType: 'field',
            value: 'test',
            format: 'format'
          }
        ]
      })
    );

    form.on('validated', () => {
      expect(form.$a.formatted).toBe('format test');
    });
  });

  it('Should plug stringFormat successfully', async () => {
    const formily = createFormily();

    formily.plug(stringFormat);

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    const form = wrapper.vm.$formily.addForm(
      defineSchema({
        formId: 'form',
        formType: 'group',
        fields: [
          {
            formId: 'a',
            formType: 'field',
            format: '{formId}',
            value: 'test'
          }
        ]
      })
    );

    form.on('validated', () => {
      expect(form.$a.formatted).toBe('a');
    });
  });

  it('Should plug dateFormat successfully', async () => {
    const formily = createFormily();

    formily.plug({
      install(config) {
        (config.plugs as any).dateFormat = {
          format(format: any, [field]: [any]) {
            return `${format} ${field.value.getFullYear()}`;
          }
        };
      }
    });

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    const form = wrapper.vm.$formily.addForm(
      defineSchema({
        formId: 'form',
        formType: 'group',
        fields: [
          {
            formId: 'a',
            formType: 'field',
            format: 'format',
            value: '2021/12/01',
            type: 'date'
          }
        ]
      })
    );

    const mockFn = jest.fn(() => {
      expect(form.$a.formatted).toBe('format 2021');
    });

    form.on('validated', mockFn);

    await flushPromises();

    expect(mockFn).toHaveBeenCalled();
  });

  test('Scoped `forms` in Vue Components', async () => {
    mount(
      {
        created(this: any) {
          this.$formily.addForm({
            formId: 'test',
            fields: []
          });
        },
        mounted(this: any) {
          expect(this.forms.test2).toBeInstanceOf(Form);
          expect(this.forms.test).toBeInstanceOf(Form);
        },
        render() {
          return h({
            created(this: any) {
              this.$formily.addForm({
                formId: 'test2',
                fields: []
              });
            },
            mounted(this: any) {
              expect(this.forms.test).toBeInstanceOf(Form);
              expect(this.forms.test2).toBeInstanceOf(Form);
            },
            render() {
              return h('div');
            }
          });
        }
      },
      {
        global: {
          plugins: [createFormily()]
        }
      }
    );
  });

  test('Reactivity', async () => {
    const formily = createFormily();

    formily.plug(stringFormat);

    const schema = defineSchema({
      formId: 'test',
      formType: 'group',
      props: {
        test(this: any) {
          return this.data.test;
        }
      },
      fields: [
        {
          formId: 'field',
          formType: 'field',
          props: {
            test(this: any, field: any) {
              return `hi, ${field.value}`;
            }
          },
          value: 0
        },
        {
          formId: 'group',
          formType: 'group',
          rules: [
            {
              name: 'test',
              validator(_value: any, _props: any, group: any) {
                return group.$field.value !== '2';
              }
            }
          ],
          fields: [
            {
              formId: 'field',
              formType: 'field',
              value: 0,
              dasdas: 'saddas'
            }
          ]
        },
        {
          formId: 'asyncProp',
          formType: 'field',
          props: {
            async test(this: any) {
              const a = await Promise.resolve('test');

              return a;
            },
            async testDepended(this: any) {
              const a = await Promise.resolve('depended');

              return `${this.props.test} ${a}`;
            }
          }
        },
        {
          formId: 'rule',
          formType: 'field',
          props: {
            test: 'rule'
          },
          rules: [
            {
              name: 'test2',
              validator() {
                return false;
              },
              message: '{context.props.test}'
            }
          ]
        },
        {
          formId: 'collection',
          formType: 'collection',
          group: {
            fields: [
              {
                formId: 'test',
                formType: 'field',
                value: 'group 1'
              }
            ]
          }
        }
      ]
    });

    type TestForm = FormInstance<typeof schema>;

    const wrapper = mount(
      {
        name: 'test',
        created() {
          this.$formily.addForm(schema);
        },
        render() {
          const form = (this as any).$formily.getForm('test') as TestForm;
          const group0 = (form as any).$collection && (form as any).$collection.groups[0];

          return h(
            'div',
            {
              id: 'test'
            },
            [
              form.$field.props.test ? `${form.$field.props.test}` : '',
              form.$group.value ? ` (1) ${form.$group.value.field}` : '',
              form.$rule && form.$rule.validation.test2.error ? ` (2) ${form.$rule.validation.test2.error}` : '',
              form.$rule && form.$rule.error ? ` (3) ${form.$rule.error}` : '',
              (form as any).$added ? ` (4) ${(form as any).$added.value}` : '',
              group0 ? ` (5) ${group0.$test.value}` : '',
              group0 && group0.$added ? ` (6) ${group0.$added.value}` : '',
              form.$asyncProp && form.$asyncProp.props.test ? ` (7) ${form.$asyncProp.props.test}` : '',
              form.$asyncProp && form.$asyncProp.props.testDepended ? ` (8) ${form.$asyncProp.props.testDepended}` : '',
              form.props.test ? ` (9) ${form.props.test}` : '',
              form.$field.error ? ` (10) ${form.$field.error}` : ''
            ]
          );
        }
      },
      {
        global: {
          plugins: [formily]
        }
      }
    );

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 0 (1) 0 (2) rule (7) test (8) test depended');

    const test = (wrapper.vm.forms.test as unknown) as TestForm;

    test.$field.raw = 1;
    test.$group.$field.raw = 1;

    test.shake();

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (1) 1 (2) rule (3) rule (7) test (8) test depended');

    test.removeField('rule');
    test.removeField('asyncProp');

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (1) 1');

    test.$group.$field.raw = 2;

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1');

    // add new field
    test.addField({
      formId: 'added',
      formType: 'field',
      value: 'added'
    });

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (4) added');

    // remove added field
    test.removeField('added');

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1');

    // add new group
    test.$collection.addGroup();

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (5) group 1');

    // add new group field
    test.$collection.addField({
      formId: 'added',
      formType: 'field',
      value: 'added'
    });

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (5) group 1 (6) added');

    // remove group field
    test.$collection.removeField('added');

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (5) group 1');

    // remove group field
    test.data.test = 'test';

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 (5) group 1 (9) test');

    test.$field.invalidate('invalidate');

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, null (5) group 1 (9) test (10) invalidate');
  });
});

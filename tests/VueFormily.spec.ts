import { createLocalVue, mount } from '@vue/test-utils';
import { createFormily, defineSchema } from '@/index';
import { Form } from '@/core/elements';
import flushPromises from 'flush-promises';
import { required } from './helpers/rules';
import { FormInstance } from '@/core/elements/instanceTypes';

describe('VueFormily', () => {
  let localVue: any;

  beforeEach(() => {
    localVue = createLocalVue();
  });

  it('Should install successfully', () => {
    localVue.use(createFormily());

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
      }
    );

    expect('$formily' in wrapper.vm).toBe(true);
  });

  it('Should add form successfully', () => {
    localVue.use(createFormily());

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
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
    localVue.use(createFormily(), {
      alias: 'myForms'
    });

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
      }
    );

    expect('myForms' in wrapper.vm).toBe(true);
  });

  it('Can turn off silent', async () => {
    localVue.use(createFormily(), {
      silent: false
    });

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
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

    localVue.use(formily, {
      silent: true
    });

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
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

    formily.plug({
      install(config) {
        (config.plugs as any).stringFormat = {
          format(format: any, field: any) {
            return `${format} ${field.value}`;
          }
        };
      }
    });

    localVue.use(formily);

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
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
            value: 'test'
          }
        ]
      })
    );

    form.on('validated', () => {
      expect(form.$a.formatted).toBe('format test');
    });
  });

  it('Should plug dateFormat successfully', async () => {
    const formily = createFormily();

    formily.plug({
      install(config) {
        (config.plugs as any).dateFormat = {
          format(format: any, field: any) {
            return `${format} ${field.value.getFullYear()}`;
          }
        };
      }
    });

    localVue.use(formily);

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
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
    localVue.use(createFormily());

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
        render(h) {
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
        localVue
      }
    );
  });

  test('Reactivity', async () => {
    localVue.use(createFormily());

    const schema = defineSchema({
      formId: 'test',
      formType: 'group',
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
        created(this: any) {
          this.$formily.addForm(schema);
        },
        render(h) {
          const form = (this as any).$formily.getForm('test') as TestForm;
          const group0 = (form as any).$collection && (form as any).$collection.groups[0];

          return h(
            'div',
            {
              attrs: {
                id: 'test'
              }
            },
            [
              form.$field.props.test,
              ' - ',
              form.$group.value ? form.$group.value.field : '',
              (form as any).$added ? (form as any).$added.value : '',
              group0 ? group0.$test.value : '',
              group0 && group0.$added ? group0.$added.value : ''
            ]
          );
        }
      },
      {
        localVue
      }
    );

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 0 - 0');

    const test = (wrapper.vm.forms.test as unknown) as TestForm;

    test.$field.raw = 1;
    test.$group.$field.raw = 1;

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - 1');

    test.$group.$field.raw = 2;

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - ');

    // add new field
    test.addField({
      formId: 'added',
      formType: 'field',
      value: 'added'
    });

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - added');

    // remove added field
    test.removeField('added');

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - ');

    // add new group
    test.$collection.addGroup();

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - group 1');

    // add new group field
    test.$collection.addField({
      formId: 'added',
      formType: 'field',
      value: ' - added'
    });

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - group 1 - added');

    // remove group field
    test.$collection.removeField('added');

    await flushPromises();

    expect(wrapper.find('#test').element.innerHTML).toBe('hi, 1 - group 1');
  });
});

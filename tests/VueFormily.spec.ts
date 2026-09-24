import { h, createApp } from 'vue';
import { mount } from '@vue/test-utils';
import { createFormily, defineSchema, useFormily } from '@/index';
import { Field, Form } from '@/core/elements';
import ScriptSetup from './helpers/ScriptSetup.vue';
import { on } from './helpers';

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

  it('Should add form successfully', async () => {
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

  it('Should plug i18n successfully', async () => {
    const formily = createFormily({
      plugs: [
        instance => {
          instance.hook.attach({
            name: 'base',
            handlers: {
              prop(payload) {
                payload.value = `localized ${payload.value}`;

                return payload;
              }
            }
          });
        }
      ]
    });

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        global: {
          plugins: [[formily, {}]]
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
            props: {
              test: 'prop'
            }
          }
        ]
      })
    );

    await on(form, 'created');

    expect(form.$a).toBeInstanceOf(Field);
    expect(form.$a.props.test).toBe('localized prop');
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

  test('Script Setup', async () => {
    const app = createApp({
      setup() {
        const formily = useFormily();

        expect(formily).toBeDefined();
      },
      template: '<div></div>'
    });

    app.use(createFormily());
    app.mount(document.createElement('div'));

    const wrapper = mount(ScriptSetup, {
      global: {
        plugins: [createFormily()]
      }
    });

    expect(wrapper.vm.$formily).toBeDefined();
  });
});

import { createLocalVue, mount } from '@vue/test-utils';
import VueFormily from '@/index';
import { Form } from '@/core/elements';
import { FormSchema } from '@/core/elements/types';
import flushPromises from 'flush-promises';
import Objeto from '@/core/Objeto';
import { required } from './helpers/rules';

describe('VueFormily', () => {
  let localVue: any;

  beforeEach(() => {
    localVue = createLocalVue();

    delete Objeto.prototype.$stringFormat;
    delete Objeto.prototype.$dateFormat;
    delete Objeto.prototype.$i18n;
  });

  it('Should install successfully', () => {
    localVue.use(VueFormily);

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
    localVue.use(VueFormily);

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
      fields: [
        {
          formId: 'a',
          format: 'test'
        }
      ]
    } as FormSchema);

    expect(form).toBeInstanceOf(Form);
    expect('form' in wrapper.vm.forms).toBe(true);
  });

  it('Can change alias', () => {
    localVue.use(VueFormily, {
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
    localVue.use(VueFormily, {
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
      fields: [
        {
          formId: 'a',
          format: 'test',
          rules: [required]
        }
      ]
    } as FormSchema);

    await flushPromises();

    expect(form.valid).toBe(true);
  });

  it('Should plug i18n successfully', () => {
    VueFormily.plug({
      install() {
        Objeto.prototype.$stringFormat = {
          format(format: any) {
            return format;
          }
        };
      }
    });
    VueFormily.plug({
      install() {
        Objeto.prototype.$i18n = {
          translate(format: any, field: any) {
            return `${format} ${field.value}`;
          }
        };
      }
    });

    localVue.use(VueFormily, {
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

    const form = wrapper.vm.$formily.addForm({
      formId: 'form',
      fields: [
        {
          formId: 'a',
          value: 'test',
          format: 'format'
        }
      ]
    } as FormSchema);

    form.on('validated', () => {
      expect(form.a.formatted).toBe('format test');
    });
  });

  it('Should plug stringFormat successfully', async () => {
    VueFormily.plug({
      install() {
        Objeto.prototype.$stringFormat = {
          format(format: any, field: any) {
            return `${format} ${field.value}`;
          }
        };
      }
    });
    localVue.use(VueFormily);

    const wrapper = mount(
      {
        template: '<div></div>'
      },
      {
        localVue
      }
    );

    const vm = wrapper.vm as any;
    const form = vm.$formily.addForm({
      formId: 'form',
      fields: [
        {
          formId: 'a',
          format: 'format',
          value: 'test'
        }
      ]
    } as FormSchema);

    form.on('validated', () => {
      expect(form.a.formatted).toBe('format test');
    });
  });

  it('Should plug dateFormat successfully', async () => {
    VueFormily.plug({
      install() {
        Objeto.prototype.$dateFormat = {
          format(format: any, field: any) {
            return `${format} ${field.value.getFullYear()}`;
          }
        };
      }
    });
    localVue.use(VueFormily);

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
      fields: [
        {
          formId: 'a',
          format: 'format',
          value: '2021/12/01',
          type: 'date'
        }
      ]
    } as FormSchema);

    const mockFn = jest.fn(() => {
      expect(form.a.formatted).toBe('format 2021');
    });

    form.on('validated', mockFn);

    await flushPromises();

    expect(mockFn).toHaveBeenCalled();
  });

  test('Scoped `forms` in Vue Components', async () => {
    localVue.use(VueFormily);

    mount(
      {
        created(this: any) {
          this.$formily.addForm({
            formId: 'test',
            fields: []
          });
        },
        mounted(this: any) {
          expect(this.forms.test2).toBe(undefined);
          expect(this.forms.test).toBeInstanceOf(Form);
          expect(this.forms.test.getVm()).toBe(this);
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
              expect(this.forms.test).toBe(undefined);
              expect(this.forms.test2).toBeInstanceOf(Form);
              expect(this.forms.test2.getVm()).toBe(this);
            },
            render(h: any) {
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
});

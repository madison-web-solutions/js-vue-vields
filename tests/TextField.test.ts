import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TextField from '../src/components/TextField.vue';

describe('TextField', () => {
  test('renders a text input by default', () => {
    const wrapper = mount(TextField);
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  test('renders input with custom inputType', () => {
    const wrapper = mount(TextField, { props: { inputType: 'email' } });
    expect(wrapper.find('input').attributes('type')).toBe('email');
  });

  test('coerces non-string modelValue to string for display', async () => {
    const wrapper = mount(TextField, { props: { modelValue: null } });
    const input = wrapper.find('input').element as HTMLInputElement;

    expect(input.value).toBe('');

    await wrapper.setProps({ modelValue: undefined });
    expect(input.value).toBe('');

    await wrapper.setProps({ modelValue: '' });
    expect(input.value).toBe('');

    await wrapper.setProps({ modelValue: 50 });
    expect(input.value).toBe('50');
  });

  test('reflects modelValue in the input, and updates when prop changes', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'hello' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('hello');

    await wrapper.setProps({ modelValue: 'world' });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('world');

    await wrapper.setProps({ modelValue: '' });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  test('emits update:modelValue when the user types', async () => {
    const wrapper = mount(TextField, { props: { modelValue: '' } });
    await wrapper.find('input').setValue('world');
    expect(lastEmittedValue(wrapper)).toEqual('world');

    await wrapper.find('input').setValue('');
    expect(lastEmittedValue(wrapper)).toEqual('');
  });

  test('correctly handles changes to errors prop', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'test' } });
    expect(wrapper.find('input').classes()).not.toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').exists()).toBe(false);

    await wrapper.setProps({ errors: { '': ['Must be at least 3 chars'] } });
    expect(wrapper.find('input').classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Must be at least 3 chars');

    await wrapper.setProps({ errors: {} });
    expect(wrapper.find('input').classes()).not.toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').exists()).toBe(false);
  });

  test('input can be enabeld and disabled', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'test', disabled: false } });
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(false);

    await wrapper.setProps({ disabled: true });
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true);

    await wrapper.setProps({ disabled: false });
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(false);
  });

  test('sets placeholder on the input', () => {
    const wrapper = mount(TextField, { props: { placeholder: 'Enter name' } });
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter name');
  });

  test('sets autocomplete on the input', () => {
    const wrapper = mount(TextField, { props: { autocomplete: 'email' } });
    expect(wrapper.find('input').attributes('autocomplete')).toBe('email');
  });

  test('sets maxlength when max prop is provided', () => {
    const wrapper = mount(TextField, { props: { max: 50 } });
    expect(wrapper.find('input').attributes('maxlength')).toBe('50');
  });

  test('shows remaining character count when user types with max set', async () => {
    const Parent = defineComponent({
      components: { TextField },
      setup: () => ({ value: ref('') }),
      template: '<TextField v-model="value" :max="10" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('span').exists()).toBe(false);

    await wrapper.find('input').setValue('hello');
    expect(wrapper.find('span').text()).toBe('5');

    await wrapper.find('input').setValue('hello wor');
    expect(wrapper.find('span').text()).toBe('1');
  });

  test('renders a label when label prop is provided', () => {
    const wrapper = mount(TextField, { props: { label: 'Full name' } });
    expect(wrapper.find('label').text()).toContain('Full name');
  });

  test('input id matches label for attribute', () => {
    const wrapper = mount(TextField, { props: { label: 'Full name' } });
    const inputId = wrapper.find('input').attributes('id');
    expect(inputId).toBeTruthy();
    expect(wrapper.find('label').attributes('for')).toBe(inputId);
  });

  test('emits enterPress when Enter is pressed', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'test' } });
    await wrapper.find('input').trigger('keydown.enter');
    expect(wrapper.emitted('enterPress')).toBeTruthy();
  });

  test('renders text value (not input) in view mode', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref('first');
    const Parent = defineComponent({
      components: { TextField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<TextField v-model="value" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('first');

    value.value = 'second';
    await nextTick();
    expect(wrapper.text()).toContain('second');

    editMode.value = 'edit';
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(true);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('second');
  });
});

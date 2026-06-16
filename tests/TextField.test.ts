import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
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

  test('emits enterPress when Enter is pressed', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'test' } });
    await wrapper.find('input').trigger('keydown.enter');
    expect(wrapper.emitted('enterPress')).toBeTruthy();
  });

  // Firefox autofills text/email fields on page load without firing input or change, leaving
  // v-model out of sync with the DOM. The opt-in autofillReconcile reads the input's DOM value
  // shortly after mount and seeds the model from it.
  describe('autofill reconciliation', () => {
    // Simulate browser autofill: write the DOM value without dispatching an input event.
    const autofill = (wrapper: ReturnType<typeof mount>, value: string) => {
      (wrapper.find('input').element as HTMLInputElement).value = value;
    };

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test('does nothing when not enabled (default off)', async () => {
      const wrapper = mount(TextField, { props: { modelValue: '' } });
      autofill(wrapper, 'autofilled@example.com');
      vi.advanceTimersByTime(100);
      await nextTick();
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    test('seeds the model shortly after mount for the silent page-load fill', async () => {
      const wrapper = mount(TextField, { props: { modelValue: '', autofillReconcile: true } });
      autofill(wrapper, 'autofilled@example.com');
      vi.advanceTimersByTime(100);
      await nextTick();
      expect(lastEmittedValue(wrapper)).toBe('autofilled@example.com');
    });

    test('never clobbers a model that already has a value', async () => {
      const wrapper = mount(TextField, { props: { modelValue: 'real value', autofillReconcile: true } });
      autofill(wrapper, 'autofilled@example.com');
      vi.advanceTimersByTime(100);
      await nextTick();
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
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

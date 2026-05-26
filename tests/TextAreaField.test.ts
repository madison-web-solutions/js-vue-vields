import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TextAreaField from '../src/components/TextAreaField.vue';

describe('TextAreaField', () => {
  test('renders a textarea element', () => {
    const wrapper = mount(TextAreaField);
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(false);
  });

  test('coerces non-string modelValue to string for display', async () => {
    const wrapper = mount(TextAreaField, { props: { modelValue: null } });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('');

    await wrapper.setProps({ modelValue: undefined });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('');

    await wrapper.setProps({ modelValue: 42 });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('42');
  });

  test('reflects modelValue in the textarea and updates when prop changes', async () => {
    const wrapper = mount(TextAreaField, { props: { modelValue: 'hello' } });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('hello');

    await wrapper.setProps({ modelValue: 'world' });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('world');
  });

  test('emits update:modelValue when the user types', async () => {
    const wrapper = mount(TextAreaField, { props: { modelValue: '' } });
    await wrapper.find('textarea').setValue('new text');
    expect(lastEmittedValue(wrapper)).toBe('new text');
  });

  test('sets placeholder on the textarea', () => {
    const wrapper = mount(TextAreaField, { props: { placeholder: 'Enter description' } });
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Enter description');
  });

  // The rows prop controls how tall the textarea is. It defaults to 4 (from config)
  // when not specified.
  test('rows prop sets the rows attribute on the textarea', async () => {
    const wrapper = mount(TextAreaField);
    expect(wrapper.find('textarea').attributes('rows')).toBe('4'); // config default

    await wrapper.setProps({ rows: 8 });
    expect(wrapper.find('textarea').attributes('rows')).toBe('8');
  });

  test('sets maxlength on the textarea when max prop is provided', () => {
    const wrapper = mount(TextAreaField, { props: { max: 200 } });
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('200');
  });

  test('shows remaining character count when user types with max set', async () => {
    const Parent = defineComponent({
      components: { TextAreaField },
      setup: () => ({ value: ref('') }),
      template: '<TextAreaField v-model="value" :max="20" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('span').exists()).toBe(false);

    await wrapper.find('textarea').setValue('hello');
    expect(wrapper.find('span').text()).toBe('15');
  });

  test('renders text value (not textarea) in view mode', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref('some text');
    const Parent = defineComponent({
      components: { TextAreaField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<TextAreaField v-model="value" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.find('textarea').exists()).toBe(false);
    expect(wrapper.text()).toContain('some text');

    value.value = 'updated text';
    await nextTick();
    expect(wrapper.text()).toContain('updated text');

    editMode.value = 'edit';
    await nextTick();
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('updated text');
  });
});

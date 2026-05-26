import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import CheckboxField from '../src/components/CheckboxField.vue';

describe('CheckboxField', () => {
  test('renders a checkbox input', () => {
    const wrapper = mount(CheckboxField);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  test('reflects boolean modelValue as checked state', async () => {
    const wrapper = mount(CheckboxField, { props: { modelValue: true } });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true);

    await wrapper.setProps({ modelValue: false });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);
  });

  test('coerces null and undefined modelValue to unchecked', async () => {
    const wrapper = mount(CheckboxField, { props: { modelValue: null } });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);

    await wrapper.setProps({ modelValue: undefined });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);
  });

  test('emits true when checked and false when unchecked', async () => {
    const Parent = defineComponent({
      components: { CheckboxField },
      setup: () => ({ value: ref(false) }),
      template: '<CheckboxField v-model="value" />',
    });
    const wrapper = mount(Parent);

    await wrapper.find('input').setValue(true);
    expect(lastEmittedValue(wrapper.findComponent(CheckboxField))).toBe(true);

    await wrapper.find('input').setValue(false);
    expect(lastEmittedValue(wrapper.findComponent(CheckboxField))).toBe(false);
  });

  // The vfm-checked class on the wrapper div can be used for custom styling
  // of a checked row (e.g. highlighting the selected option).
  test('vfm-checked class is present on the wrapper div when checked', async () => {
    const wrapper = mount(CheckboxField, { props: { modelValue: true } });
    expect(wrapper.find('.form-check').classes()).toContain('vfm-checked');

    await wrapper.setProps({ modelValue: false });
    expect(wrapper.find('.form-check').classes()).not.toContain('vfm-checked');
  });

  // When inlineLabel is true the label appears next to the checkbox (form-check-label),
  // which is the natural layout for a checkbox. When false/omitted the label is passed
  // to FieldWrapper and appears above the checkbox (form-label), consistent with other
  // field types.
  test('with inlineLabel the label appears next to the checkbox', () => {
    const wrapper = mount(CheckboxField, { props: { label: 'I agree', inlineLabel: true } });
    expect(wrapper.find('.form-check-label').text()).toContain('I agree');
    expect(wrapper.find('.form-label').exists()).toBe(false);
  });

  test('without inlineLabel the label appears in FieldWrapper above the checkbox', () => {
    const wrapper = mount(CheckboxField, { props: { label: 'Agreed', inlineLabel: false } });
    expect(wrapper.find('.form-label').text()).toContain('Agreed');
    expect(wrapper.find('.form-check-label').exists()).toBe(false);
  });

  // In view mode the checkbox is replaced by a human-readable text label so the value
  // is legible without an interactive control. The default labels are 'Yes' and 'No'.
  test('renders Yes/No text in view mode with default labels', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref(true);
    const Parent = defineComponent({
      components: { CheckboxField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<CheckboxField v-model="value" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('Yes');

    value.value = false;
    await nextTick();
    expect(wrapper.text()).toContain('No');
  });

  test('uses custom trueLabel and falseLabel in view mode', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref(true);
    const Parent = defineComponent({
      components: { CheckboxField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<CheckboxField v-model="value" trueLabel="Enabled" falseLabel="Disabled" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.text()).toContain('Enabled');

    value.value = false;
    await nextTick();
    expect(wrapper.text()).toContain('Disabled');
  });
});

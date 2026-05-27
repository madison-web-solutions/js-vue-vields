import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import ToggleField from '../src/components/ToggleField.vue';

describe('ToggleField', () => {
  test('renders a checkbox input', () => {
    const wrapper = mount(ToggleField);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  test('reflects boolean modelValue as checked state', async () => {
    const wrapper = mount(ToggleField, { props: { modelValue: true } });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true);

    await wrapper.setProps({ modelValue: false });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);
  });

  test('coerces null and undefined modelValue to unchecked', async () => {
    const wrapper = mount(ToggleField, { props: { modelValue: null } });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);

    await wrapper.setProps({ modelValue: undefined });
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);
  });

  test('emits true when toggled on and false when toggled off', async () => {
    const Parent = defineComponent({
      components: { ToggleField },
      setup: () => ({ value: ref(false) }),
      template: '<ToggleField v-model="value" />',
    });
    const wrapper = mount(Parent);

    await wrapper.find('input').setValue(true);
    expect(lastEmittedValue(wrapper.findComponent(ToggleField))).toBe(true);

    await wrapper.find('input').setValue(false);
    expect(lastEmittedValue(wrapper.findComponent(ToggleField))).toBe(false);
  });

  test('shows On/Off label next to the switch by default', async () => {
    const wrapper = mount(ToggleField, { props: { modelValue: true } });
    expect(wrapper.find('.form-check-label').text()).toBe('On');

    await wrapper.setProps({ modelValue: false });
    expect(wrapper.find('.form-check-label').text()).toBe('Off');
  });

  test('shows empty label for null modelValue', () => {
    const wrapper = mount(ToggleField, { props: { modelValue: null } });
    expect(wrapper.find('.form-check-label').text()).toBe('');
  });

  test('uses custom trueLabel and falseLabel', async () => {
    const wrapper = mount(ToggleField, { props: { modelValue: true, trueLabel: 'Enabled', falseLabel: 'Disabled' } });
    expect(wrapper.find('.form-check-label').text()).toBe('Enabled');

    await wrapper.setProps({ modelValue: false });
    expect(wrapper.find('.form-check-label').text()).toBe('Disabled');
  });

  test('renders On/Off text in view mode', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref(true);
    const Parent = defineComponent({
      components: { ToggleField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<ToggleField v-model="value" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('On');

    value.value = false;
    await nextTick();
    expect(wrapper.text()).toContain('Off');
  });

  test('uses custom labels in view mode', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref(true);
    const Parent = defineComponent({
      components: { ToggleField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<ToggleField v-model="value" trueLabel="Active" falseLabel="Inactive" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.text()).toContain('Active');

    value.value = false;
    await nextTick();
    expect(wrapper.text()).toContain('Inactive');
  });
});

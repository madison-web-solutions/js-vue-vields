import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue, settle } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import NumberField from '../src/components/NumberField.vue';

describe('NumberField', () => {
  test('renders a text input', () => {
    const wrapper = mount(NumberField);
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  test('displays null as empty string', () => {
    const wrapper = mount(NumberField, { props: { modelValue: null } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  test('displays a number', () => {
    const wrapper = mount(NumberField, { props: { modelValue: 42 } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('42');
  });

  test('updates display when modelValue prop changes', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 10 } });
    await wrapper.setProps({ modelValue: 20 });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('20');
  });

  test('emits a number when valid input is entered', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('5');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(5);
  });

  test('emits null when input is cleared', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 42 } });
    await wrapper.find('input').setValue('');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('emits null for non-numeric input', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 42 } });
    await wrapper.find('input').setValue('abc');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('clamps value to max', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: null, max: 100 } });
    await wrapper.find('input').setValue('200');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(100);
  });

  test('clamps value to min', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: null, min: 10 } });
    await wrapper.find('input').setValue('1');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(10);
  });

  test('integersOnly rounds to the nearest integer', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: null, integersOnly: true } });
    await wrapper.find('input').setValue('3.7');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(4);

    await wrapper.find('input').setValue('3.2');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(3);
  });

  test('decimals rounds to the specified number of decimal places', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: null, decimals: 2 } });
    await wrapper.find('input').setValue('3.456');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(3.46);
  });

  test('step rounds to the nearest multiple of step', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: null, step: 5 } });
    await wrapper.find('input').setValue('13');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(15);
  });

  // customDisplayValue replaces the formatted output when the field is blurred.
  // When focused, formatForEditing takes over and shows the raw number, ignoring customDisplayValue.
  test('customDisplayValue is shown when blurred', () => {
    const wrapper = mount(NumberField, { props: { modelValue: 42, customDisplayValue: 'forty-two' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('forty-two');
  });

  test('customDisplayValue is shown for null modelValue', () => {
    const wrapper = mount(NumberField, { props: { modelValue: null, customDisplayValue: 'N/A' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('N/A');
  });

  test('focus replaces customDisplayValue with the raw number', async () => {
    const wrapper = mount(NumberField, { props: { modelValue: 42, customDisplayValue: 'forty-two' } });
    await wrapper.find('input').trigger('focus');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('42');
  });

  test('unit prop renders a text span next to the input', () => {
    const wrapper = mount(NumberField, { props: { unit: 'kg' } });
    expect(wrapper.find('.input-group-text').text()).toBe('kg');
  });

  test('no unit span when unit prop is not set', () => {
    const wrapper = mount(NumberField);
    expect(wrapper.find('.input-group-text').exists()).toBe(false);
  });

  // When the user types a value that the clamp maps to the same number as the current
  // modelValue, Vue's :value diff is a no-op and would leave "200" visible in the input.
  // commit() writes the canonical string straight to the DOM so the input resets.
  test('DOM resets to canonical value when typed input clamps to current modelValue', async () => {
    const Parent = defineComponent({
      components: { NumberField },
      setup: () => ({ value: ref(100) }),
      template: '<NumberField v-model="value" :max="100" />',
    });
    const wrapper = mount(Parent);
    const input = wrapper.find('input').element as HTMLInputElement;
    expect(input.value).toBe('100');

    await wrapper.find('input').setValue('200');
    await settle();

    expect(input.value).toBe('100');
  });

  test('renders the value as text in view mode', async () => {
    const editMode = ref<EditMode>('view');
    const value = ref(42);
    const Parent = defineComponent({
      components: { NumberField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value };
      },
      template: '<NumberField v-model="value" />',
    });
    const wrapper = mount(Parent);

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('42');

    value.value = 99;
    await nextTick();
    expect(wrapper.text()).toContain('99');
  });
});

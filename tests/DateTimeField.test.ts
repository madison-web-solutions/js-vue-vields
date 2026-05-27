import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import { lastEmittedValue, settle } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import DateTimeField from '../src/components/DateTimeField.vue';

// Helpers for the two sub-inputs rendered inside the component.
const dateInput = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('input[type="date"]');
const timeInput = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('input[type="text"]');

// DateTimeField is driven by a nested DateField + TimeField. DateField interactions
// are synchronous; TimeField interactions go through useParsesTextField's 10ms
// setTimeout and require settle() after setValue.

describe('DateTimeField', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('renders a date input and a time input', () => {
    const wrapper = mount(DateTimeField);
    expect(dateInput(wrapper).exists()).toBe(true);
    expect(timeInput(wrapper).exists()).toBe(true);
  });

  test('displays null as two empty inputs', () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: null } });
    expect((dateInput(wrapper).element as HTMLInputElement).value).toBe('');
    expect((timeInput(wrapper).element as HTMLInputElement).value).toBe('');
  });

  test('reflects a full datetime string in both sub-inputs', () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30' } });
    expect((dateInput(wrapper).element as HTMLInputElement).value).toBe('2024-06-15');
    expect((timeInput(wrapper).element as HTMLInputElement).value).toBe('14:30');
  });

  test('updates both sub-inputs when the modelValue prop changes', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30' } });
    await wrapper.setProps({ modelValue: '2025-01-01 09:00' });
    expect((dateInput(wrapper).element as HTMLInputElement).value).toBe('2025-01-01');
    expect((timeInput(wrapper).element as HTMLInputElement).value).toBe('09:00');
  });

  test('does not emit until both date and time sub-fields are set', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: null } });
    await dateInput(wrapper).setValue('2024-06-15');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  test('emits combined datetime string when both sub-fields are set', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: null } });
    await dateInput(wrapper).setValue('2024-06-15');
    await timeInput(wrapper).setValue('14:30');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('2024-06-15 14:30');
  });

  test('preserves the time when the date sub-field is updated', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30' } });
    await dateInput(wrapper).setValue('2024-07-01');
    expect(lastEmittedValue(wrapper)).toBe('2024-07-01 14:30');
  });

  test('preserves the date when the time sub-field is updated', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30' } });
    await timeInput(wrapper).setValue('16:00');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('2024-06-15 16:00');
  });

  test('emits null when both sub-fields are cleared', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30' } });
    await dateInput(wrapper).setValue('');
    await timeInput(wrapper).setValue('');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('min and max props set the corresponding attributes on the date sub-input', () => {
    const wrapper = mount(DateTimeField, {
      props: { min: '2024-01-01 00:00:00', max: '2024-12-31 23:59:59' },
    });
    expect(dateInput(wrapper).attributes('min')).toBe('2024-01-01');
    expect(dateInput(wrapper).attributes('max')).toBe('2024-12-31');
  });

  test('errors prop marks both sub-inputs as invalid', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30' } });
    expect(dateInput(wrapper).classes()).not.toContain('is-invalid');
    expect(timeInput(wrapper).classes()).not.toContain('is-invalid');

    await wrapper.setProps({ errors: { '': ['Required'] } });
    expect(dateInput(wrapper).classes()).toContain('is-invalid');
    expect(timeInput(wrapper).classes()).toContain('is-invalid');
  });

  test('disabled prop disables both sub-inputs', async () => {
    const wrapper = mount(DateTimeField, { props: { modelValue: '2024-06-15 14:30', disabled: false } });
    expect((dateInput(wrapper).element as HTMLInputElement).disabled).toBe(false);
    expect((timeInput(wrapper).element as HTMLInputElement).disabled).toBe(false);

    await wrapper.setProps({ disabled: true });
    expect((dateInput(wrapper).element as HTMLInputElement).disabled).toBe(true);
    expect((timeInput(wrapper).element as HTMLInputElement).disabled).toBe(true);
  });

  test('renders formatted datetime in view mode using default d/m/Y H:i format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { DateTimeField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('2024-06-15 14:30:00') };
      },
      template: '<DateTimeField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('15/06/2024 14:30');
  });

  test('displayFormat prop changes the view mode format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { DateTimeField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('2024-06-15 14:30:00') };
      },
      template: '<DateTimeField v-model="value" displayFormat="Y-m-d H:i" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('2024-06-15 14:30');
  });
});

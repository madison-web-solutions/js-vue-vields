import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import { lastEmittedValue, settle } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TimestampField from '../src/components/TimestampField.vue';

// All timestamp tests use timeZone: 'utc' so expected values are deterministic
// regardless of the machine's local timezone.
//
// 2024-06-15 14:30:00 UTC = 1718461800000 ms (verified: Date.UTC(2024,5,15,14,30,0))
const TS_2024_06_15_14_30 = Date.UTC(2024, 5, 15, 14, 30, 0); // 1718461800000

const dateInput = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('input[type="date"]');
const timeInput = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('input[type="text"]');

// TimestampField uses a watcher to combine date + time into a timestamp. The watcher
// only emits when BOTH sub-fields are set (or both are cleared). DateField interactions
// are synchronous; TimeField interactions go through useParsesTextField and need settle().

describe('TimestampField', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('renders a date input and a time input', () => {
    const wrapper = mount(TimestampField, { props: { timeZone: 'utc' } });
    expect(dateInput(wrapper).exists()).toBe(true);
    expect(timeInput(wrapper).exists()).toBe(true);
  });

  test('displays null as two empty inputs', () => {
    const wrapper = mount(TimestampField, { props: { modelValue: null, timeZone: 'utc' } });
    expect((dateInput(wrapper).element as HTMLInputElement).value).toBe('');
    expect((timeInput(wrapper).element as HTMLInputElement).value).toBe('');
  });

  test('reflects a timestamp in both sub-inputs', () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    expect((dateInput(wrapper).element as HTMLInputElement).value).toBe('2024-06-15');
    expect((timeInput(wrapper).element as HTMLInputElement).value).toBe('14:30:00');
  });

  test('updates both sub-inputs when the modelValue prop changes', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    const ts2 = Date.UTC(2025, 0, 1, 9, 0, 0);
    await wrapper.setProps({ modelValue: ts2 });
    expect((dateInput(wrapper).element as HTMLInputElement).value).toBe('2025-01-01');
    expect((timeInput(wrapper).element as HTMLInputElement).value).toBe('09:00:00');
  });

  // Unlike DateTimeField, TimestampField does not emit a partial value when only
  // one sub-field is set — it waits until both date and time are provided.
  test('does not emit until both date and time sub-fields are set', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: null, timeZone: 'utc' } });
    await dateInput(wrapper).setValue('2024-06-15');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  test('emits a UTC timestamp when both sub-fields are set', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: null, timeZone: 'utc' } });
    await dateInput(wrapper).setValue('2024-06-15');
    await timeInput(wrapper).setValue('14:30:00');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(TS_2024_06_15_14_30);
  });

  test('emits an updated timestamp when the date sub-field is changed', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    await dateInput(wrapper).setValue('2024-07-01');
    // DateField change is synchronous; watch fires on next tick
    await vi.runAllTimersAsync();
    const expected = Date.UTC(2024, 6, 1, 14, 30, 0);
    expect(lastEmittedValue(wrapper)).toBe(expected);
  });

  test('emits an updated timestamp when the time sub-field is changed', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    await timeInput(wrapper).setValue('16:00:00');
    await settle();
    const expected = Date.UTC(2024, 5, 15, 16, 0, 0);
    expect(lastEmittedValue(wrapper)).toBe(expected);
  });

  test('emits null when both sub-fields are cleared', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    await dateInput(wrapper).setValue('');
    await timeInput(wrapper).setValue('');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('min and max props set the corresponding attributes on the date sub-input', () => {
    const wrapper = mount(TimestampField, {
      props: {
        timeZone: 'utc',
        min: Date.UTC(2024, 0, 1),
        max: Date.UTC(2024, 11, 31),
      },
    });
    expect(dateInput(wrapper).attributes('min')).toBe('2024-01-01');
    expect(dateInput(wrapper).attributes('max')).toBe('2024-12-31');
  });

  test('errors prop marks both sub-inputs as invalid', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    expect(dateInput(wrapper).classes()).not.toContain('is-invalid');
    expect(timeInput(wrapper).classes()).not.toContain('is-invalid');

    await wrapper.setProps({ errors: { '': ['Required'] } });
    expect(dateInput(wrapper).classes()).toContain('is-invalid');
    expect(timeInput(wrapper).classes()).toContain('is-invalid');
  });

  test('disabled prop disables both sub-inputs', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc', disabled: false } });
    expect((dateInput(wrapper).element as HTMLInputElement).disabled).toBe(false);
    expect((timeInput(wrapper).element as HTMLInputElement).disabled).toBe(false);

    await wrapper.setProps({ disabled: true });
    expect((dateInput(wrapper).element as HTMLInputElement).disabled).toBe(true);
    expect((timeInput(wrapper).element as HTMLInputElement).disabled).toBe(true);
  });

  test('renders formatted datetime in view mode using default d/m/Y H:i format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { TimestampField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref(TS_2024_06_15_14_30) };
      },
      template: '<TimestampField v-model="value" timeZone="utc" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('15/06/2024 14:30');
  });

  test('displayFormat prop changes the view mode format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { TimestampField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref(TS_2024_06_15_14_30) };
      },
      template: '<TimestampField v-model="value" timeZone="utc" displayFormat="Y-m-d H:i" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('2024-06-15 14:30');
  });

  test('forwards enterPress from its sub-inputs', async () => {
    const wrapper = mount(TimestampField, { props: { modelValue: TS_2024_06_15_14_30, timeZone: 'utc' } });
    await dateInput(wrapper).trigger('keydown.enter');
    expect(wrapper.emitted('enterPress')).toBeTruthy();

    await timeInput(wrapper).trigger('keydown.enter');
    expect(wrapper.emitted('enterPress')).toHaveLength(2);
  });
});

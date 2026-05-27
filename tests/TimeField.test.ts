import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import { lastEmittedValue, settle } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TimeField from '../src/components/TimeField.vue';

describe('TimeField', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('renders a text input', () => {
    const wrapper = mount(TimeField);
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  test('displays null as empty string', () => {
    const wrapper = mount(TimeField, { props: { modelValue: null } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  test('displays a time value', () => {
    const wrapper = mount(TimeField, { props: { modelValue: '14:30' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('14:30');
  });

  test('updates display when modelValue prop changes', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: '09:00' } });
    await wrapper.setProps({ modelValue: '17:00' });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('17:00');
  });

  test('normalizes and emits canonical HH:MM format', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('1430');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('14:30');
  });

  test('accepts dot as a separator', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('14.30');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('14:30');
  });

  test('emits null when input is cleared', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: '14:30' } });
    await wrapper.find('input').setValue('');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('emits null for unparseable input', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: '14:30' } });
    await wrapper.find('input').setValue('not a time');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('clamps to max', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null, max: '18:00' } });
    await wrapper.find('input').setValue('20:00');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('18:00');
  });

  test('clamps to min', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null, min: '09:00' } });
    await wrapper.find('input').setValue('07:00');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('09:00');
  });

  test('step rounds to the nearest interval', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null, step: '00:30' } });
    await wrapper.find('input').setValue('14:20');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('14:30');
  });

  test('without withSeconds, seconds are stripped from emitted value', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('14:30:45');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('14:30');
  });

  test('withSeconds includes seconds in emitted value', async () => {
    const wrapper = mount(TimeField, { props: { modelValue: null, withSeconds: true } });
    await wrapper.find('input').setValue('14:30:45');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe('14:30:45');
  });

  test('default placeholder is hh:mm', () => {
    const wrapper = mount(TimeField);
    expect(wrapper.find('input').attributes('placeholder')).toBe('hh:mm');
  });

  test('placeholder is hh:mm:ss when withSeconds is true', () => {
    const wrapper = mount(TimeField, { props: { withSeconds: true } });
    expect(wrapper.find('input').attributes('placeholder')).toBe('hh:mm:ss');
  });

  // DOM reset: type a time that clamps to the current modelValue. Without updateAfterClearing,
  // Vue would skip re-evaluating displayValue and leave the typed text in the input.
  test('DOM resets to canonical value when typed input clamps to current modelValue', async () => {
    const Parent = defineComponent({
      components: { TimeField },
      setup: () => ({ value: ref('18:00') }),
      template: '<TimeField v-model="value" max="18:00" />',
    });
    const wrapper = mount(Parent);
    const input = wrapper.find('input').element as HTMLInputElement;
    expect(input.value).toBe('18:00');

    await wrapper.find('input').setValue('20:00');
    await settle();

    expect(input.value).toBe('18:00');
  });

  test('renders the value as text in view mode', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { TimeField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('14:30') };
      },
      template: '<TimeField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('14:30');
  });
});

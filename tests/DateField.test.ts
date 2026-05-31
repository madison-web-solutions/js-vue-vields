import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import { lastEmittedValue } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import DateField from '../src/components/DateField.vue';

describe('DateField', () => {
  test('renders a date input', () => {
    const wrapper = mount(DateField);
    expect(wrapper.find('input').attributes('type')).toBe('date');
  });

  test('displays null as empty string', () => {
    const wrapper = mount(DateField, { props: { modelValue: null } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  test('reflects modelValue in the input', () => {
    const wrapper = mount(DateField, { props: { modelValue: '2024-06-15' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('2024-06-15');
  });

  test('updates display when modelValue prop changes', async () => {
    const wrapper = mount(DateField, { props: { modelValue: '2024-01-01' } });
    await wrapper.setProps({ modelValue: '2024-12-31' });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('2024-12-31');
  });

  test('emits ISO date string when user selects a date', async () => {
    const wrapper = mount(DateField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('2024-06-15');
    expect(lastEmittedValue(wrapper)).toBe('2024-06-15');
  });

  test('emits null when the input is cleared', async () => {
    const wrapper = mount(DateField, { props: { modelValue: '2024-06-15' } });
    await wrapper.find('input').setValue('');
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  // DateField deliberately skips clamping on @change so the user can type freely.
  // Clamping only happens on blur (and Enter/Tab).
  test('does not clamp on change', async () => {
    const wrapper = mount(DateField, { props: { modelValue: null, max: '2024-12-31' } });
    await wrapper.find('input').setValue('2025-06-15');
    expect(lastEmittedValue(wrapper)).toBe('2025-06-15');
  });

  test('clamps to max on blur', async () => {
    const wrapper = mount(DateField, { props: { modelValue: null, max: '2024-12-31' } });
    (wrapper.find('input').element as HTMLInputElement).value = '2025-06-15';
    await wrapper.find('input').trigger('blur');
    expect(lastEmittedValue(wrapper)).toBe('2024-12-31');
  });

  test('clamps to min on blur', async () => {
    const wrapper = mount(DateField, { props: { modelValue: null, min: '2024-01-01' } });
    (wrapper.find('input').element as HTMLInputElement).value = '2023-06-15';
    await wrapper.find('input').trigger('blur');
    expect(lastEmittedValue(wrapper)).toBe('2024-01-01');
  });

  test('clamps to max on Enter key', async () => {
    const wrapper = mount(DateField, { props: { modelValue: null, max: '2024-12-31' } });
    (wrapper.find('input').element as HTMLInputElement).value = '2025-06-15';
    await wrapper.find('input').trigger('keydown.enter');
    expect(lastEmittedValue(wrapper)).toBe('2024-12-31');
  });

  test('min prop sets the min attribute on the input', () => {
    const wrapper = mount(DateField, { props: { min: '2024-01-01' } });
    expect(wrapper.find('input').attributes('min')).toBe('2024-01-01');
  });

  test('max prop sets the max attribute on the input', () => {
    const wrapper = mount(DateField, { props: { max: '2024-12-31' } });
    expect(wrapper.find('input').attributes('max')).toBe('2024-12-31');
  });

  test('default placeholder is dd/mm/yyyy', () => {
    const wrapper = mount(DateField);
    expect(wrapper.find('input').attributes('placeholder')).toBe('dd/mm/yyyy');
  });

  test('renders formatted date in view mode using default d/m/Y format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { DateField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('2024-06-15') };
      },
      template: '<DateField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('15/06/2024');
  });

  test('displayFormat prop changes the view mode format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { DateField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('2024-06-15') };
      },
      template: '<DateField v-model="value" displayFormat="Y-m-d" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('2024-06-15');
  });

  test('config date.displayFormat changes the default view mode format', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { DateField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        provide(injectionSymbols.config, ref({ 'date.displayFormat': 'm/d/Y' }));
        return { value: ref('2024-06-15') };
      },
      template: '<DateField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('06/15/2024');
  });

  test('displayFormat prop overrides config date.displayFormat', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { DateField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        provide(injectionSymbols.config, ref({ 'date.displayFormat': 'm/d/Y' }));
        return { value: ref('2024-06-15') };
      },
      template: '<DateField v-model="value" displayFormat="Y-m-d" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('2024-06-15');
  });

  test('emits enterPress when Enter is pressed', async () => {
    const wrapper = mount(DateField, { props: { modelValue: '2024-06-15' } });
    await wrapper.find('input').trigger('keydown.enter');
    expect(wrapper.emitted('enterPress')).toBeTruthy();
  });
});

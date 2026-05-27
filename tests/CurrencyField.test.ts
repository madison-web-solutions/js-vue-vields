import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue, settle } from './utils';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import CurrencyField from '../src/components/CurrencyField.vue';

// CurrencyField stores values in minor units (e.g. cents): £12.50 → 1250, 1 KWD → 1000.
describe('CurrencyField', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('renders a text input', () => {
    const wrapper = mount(CurrencyField);
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  test('displays null as empty string', () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  // formatForEditing = String(minorUnits / 10^exponent), so this is locale-independent.
  test('focused display shows raw major-unit value', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 1250 } });
    await wrapper.find('input').trigger('focus');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('12.5');
  });

  test('updates display when modelValue prop changes', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 1000 } });
    await wrapper.setProps({ modelValue: 2000 });
    await wrapper.find('input').trigger('focus');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('20');
  });

  test('emits minor-unit integer when user enters a decimal amount', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('12.50');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(1250);
  });

  test('emits null when input is cleared', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 1250 } });
    await wrapper.find('input').setValue('');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('emits null for non-numeric input', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 1250 } });
    await wrapper.find('input').setValue('abc');
    await settle();
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('strips leading currency symbols from input', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('£12.50');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(1250);
  });

  test('clamps to max (in minor units)', async () => {
    // 10.00 → 1000 minor units → clamped to max 500
    const wrapper = mount(CurrencyField, { props: { modelValue: null, max: 500 } });
    await wrapper.find('input').setValue('10.00');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(500);
  });

  test('clamps to min (in minor units)', async () => {
    // 0.50 → 50 minor units → clamped to min 100
    const wrapper = mount(CurrencyField, { props: { modelValue: null, min: 100 } });
    await wrapper.find('input').setValue('0.50');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(100);
  });

  test('showCurrency renders the currency code badge', () => {
    const wrapper = mount(CurrencyField, { props: { currencyCode: 'USD', showCurrency: true } });
    expect(wrapper.find('.input-group-text').text()).toBe('USD');
  });

  test('no currency badge when showCurrency is false', () => {
    const wrapper = mount(CurrencyField, { props: { currencyCode: 'USD', showCurrency: false } });
    expect(wrapper.find('.input-group-text').exists()).toBe(false);
  });

  // KWD (Kuwaiti Dinar) has 3 decimal places (like IQD, BHD, JOD), so 1 KWD = 1000 minor units (fils).
  test('3-decimal currency (KWD): entering 1 emits 1000 minor units', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null, currencyCode: 'KWD' } });
    await wrapper.find('input').setValue('1');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(1000);
  });

  test('3-decimal currency (KWD): entering 1.500 emits 1500 minor units', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null, currencyCode: 'KWD' } });
    await wrapper.find('input').setValue('1.500');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(1500);
  });

  test('3-decimal currency (KWD): focused display shows raw major-unit value', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 12500, currencyCode: 'KWD' } });
    await wrapper.find('input').trigger('focus');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('12.5');
  });

  // DOM reset: type a value that clamps to the same as the current modelValue. Without
  // updateAfterClearing, Vue would skip re-rendering displayValue and leave the typed
  // text in the input.
  test('DOM resets to canonical value when typed input clamps to current modelValue', async () => {
    const Parent = defineComponent({
      components: { CurrencyField },
      setup: () => ({ value: ref(1000) }), // 1000 minor units = £10.00
      template: '<CurrencyField v-model="value" :max="1000" />',
    });
    const wrapper = mount(Parent);
    const input = wrapper.find('input').element as HTMLInputElement;

    // Enter 200 → 20000 minor units → clamped back to 1000 (same as current modelValue)
    await wrapper.find('input').setValue('200');
    await settle();

    expect(input.value).not.toBe('200');
  });

  test('renders the value as text in view mode', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { CurrencyField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref(1250) };
      },
      template: '<CurrencyField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('12');
  });
});

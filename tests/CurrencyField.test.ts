import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { lastEmittedValue, settle } from './utils';
import type { Config, EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import { defaultConfig } from '../src/lib/config';
import CurrencyField from '../src/components/CurrencyField.vue';

// By default CurrencyField stores values in minor units (e.g. cents): £12.50 → 1250, 1 KWD → 1000.
// With denomination 'major-unit' (prop or config) it stores floats in major units: £12.50 → 12.5.
describe('CurrencyField', () => {
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

  // 1.005 * 100 is 100.49999999999999 in IEEE-754; the conversion guard must still round it up.
  test('rounds half-minor-unit input up despite float artefacts', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null } });
    await wrapper.find('input').setValue('1.005');
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(101);
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

  // DOM reset: type a value that clamps to the same as the current modelValue. Vue's
  // :value diff is a no-op here, so commit() writes the canonical string straight to
  // the input rather than leaving the typed text in place.
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

  test('emits enterPress when Enter is pressed', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 1250 } });
    await wrapper.find('input').trigger('keydown.enter');
    expect(wrapper.emitted('enterPress')).toBeTruthy();
  });

  // Amounts are displayed with the locale's group separator, so the same text must be
  // accepted back - otherwise parsing stops at the separator and "12,345.67" becomes 12.
  test('accepts input containing group separators', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: null } });
    await wrapper.find('input').setValue(new Intl.NumberFormat().format(12345.67));
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(1234567);
  });

  test('round-trips its own displayed value', async () => {
    const wrapper = mount(CurrencyField, { props: { modelValue: 1234567 } });
    const input = wrapper.find('input');
    await input.setValue((input.element as HTMLInputElement).value);
    await settle();
    expect(lastEmittedValue(wrapper)).toBe(1234567);
  });

  describe('magnitude suffixes', () => {
    const mountWithSuffixes = (props: Record<string, unknown>) => {
      const config = ref<Config>({ ...defaultConfig, parseMagnitudeSuffixes: true });
      return mount(CurrencyField, {
        props,
        global: { provide: { [injectionSymbols.config as symbol]: config } },
      });
    };

    test('are off by default, so a suffix is ignored', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null } });
      await wrapper.find('input').setValue('2k');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(200);
    });

    test('are applied when enabled by config, in the currency major unit', async () => {
      const wrapper = mountWithSuffixes({ modelValue: null });
      await wrapper.find('input').setValue('2k');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(200000);
    });

    test('are applied after the currency symbol is stripped', async () => {
      const wrapper = mountWithSuffixes({ modelValue: null, currencyCode: 'GBP' });
      await wrapper.find('input').setValue('£2k');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(200000);
    });

    test('are applied in major-unit denomination too', async () => {
      const wrapper = mountWithSuffixes({ modelValue: null, denomination: 'major-unit' as const });
      await wrapper.find('input').setValue('2k');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(2000);
    });
  });

  describe('major-unit denomination', () => {
    const major = { denomination: 'major-unit' as const };
    const inputValue = (wrapper: ReturnType<typeof mount>): string => {
      return (wrapper.find('input').element as HTMLInputElement).value;
    };

    test('emits a major-unit float when user enters a decimal amount', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, ...major } });
      await wrapper.find('input').setValue('12.50');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(12.5);
    });

    test('strips leading currency symbols from input', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, ...major } });
      await wrapper.find('input').setValue('£1.15');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1.15);
    });

    // 1.15 * 100 is 114.99999999999999 in IEEE-754: the emitted value must be exactly 1.15, not 1.14.
    test('emits an exact float with no rounding artefacts', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, ...major } });
      await wrapper.find('input').setValue('1.15');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1.15);
    });

    test('rounds input to the currency precision', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, ...major } });
      await wrapper.find('input').setValue('1.005');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1.01);
    });

    test('handles negative amounts', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, ...major } });
      await wrapper.find('input').setValue('-1.15');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(-1.15);
    });

    test('handles zero', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, ...major } });
      await wrapper.find('input').setValue('0');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(0);
    });

    test('emits null when input is cleared', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: 12.5, ...major } });
      await wrapper.find('input').setValue('');
      await settle();
      expect(lastEmittedValue(wrapper)).toBeNull();
    });

    test('emits null for non-numeric input', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: 12.5, ...major } });
      await wrapper.find('input').setValue('abc');
      await settle();
      expect(lastEmittedValue(wrapper)).toBeNull();
    });

    test('focused display shows the raw major-unit value', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: 12.5, ...major } });
      await wrapper.find('input').trigger('focus');
      expect(inputValue(wrapper)).toBe('12.5');
    });

    test('focused display of a whole amount has no trailing decimals', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: 20, ...major } });
      await wrapper.find('input').trigger('focus');
      expect(inputValue(wrapper)).toBe('20');
    });

    test('a value with excess precision is displayed rounded but not re-emitted', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: 12.345, ...major } });
      await wrapper.find('input').trigger('focus');
      expect(inputValue(wrapper)).toBe('12.35');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    test('clamps to max (in major units)', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, max: 5, ...major } });
      await wrapper.find('input').setValue('10.00');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(5);
    });

    test('clamps to min (in major units)', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, min: 1, ...major } });
      await wrapper.find('input').setValue('0.50');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1);
    });

    test('rounds to step (in major units) without float artefacts', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, step: 0.05, ...major } });
      await wrapper.find('input').setValue('1.13');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1.15);
    });

    test('3-decimal currency (KWD): entering 1.5 emits 1.5', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, currencyCode: 'KWD', ...major } });
      await wrapper.find('input').setValue('1.5');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1.5);
    });

    test('3-decimal currency (KWD): input is rounded to 3 decimals', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: null, currencyCode: 'KWD', ...major } });
      await wrapper.find('input').setValue('1.2345');
      await settle();
      expect(lastEmittedValue(wrapper)).toBe(1.235);
    });

    test('3-decimal currency (KWD): focused display shows the raw major-unit value', async () => {
      const wrapper = mount(CurrencyField, { props: { modelValue: 12.5, currencyCode: 'KWD', ...major } });
      await wrapper.find('input').trigger('focus');
      expect(inputValue(wrapper)).toBe('12.5');
    });

    test('renders the formatted value in view mode', () => {
      const editMode = ref<EditMode>('view');
      const Parent = defineComponent({
        components: { CurrencyField },
        setup() {
          provide(injectionSymbols.editMode, editMode);
          return { value: ref(12.5) };
        },
        template: '<CurrencyField v-model="value" currencyCode="GBP" denomination="major-unit" />',
      });
      const wrapper = mount(Parent);
      expect(wrapper.find('input').exists()).toBe(false);
      expect(wrapper.text()).toContain('12.50');
    });

    const mountWithConfig = (denomination: 'minor-unit' | 'major-unit', propDenomination?: 'minor-unit' | 'major-unit') => {
      const Parent = defineComponent({
        components: { CurrencyField },
        props: { propDenomination: { type: String, default: undefined } },
        setup() {
          provide(injectionSymbols.config, ref({ ...defaultConfig, 'currency.denomination': denomination }));
          return { value: ref<number | null>(null) };
        },
        template: '<CurrencyField v-model="value" :denomination="propDenomination" />',
      });
      return mount(Parent, { props: { propDenomination } });
    };

    test('denomination can be set via the injected config', async () => {
      const wrapper = mountWithConfig('major-unit');
      await wrapper.find('input').setValue('12.50');
      await settle();
      expect(wrapper.findComponent(CurrencyField).emitted('update:modelValue')?.at(-1)?.[0]).toBe(12.5);
    });

    test('the denomination prop overrides the injected config', async () => {
      const wrapper = mountWithConfig('major-unit', 'minor-unit');
      await wrapper.find('input').setValue('12.50');
      await settle();
      expect(wrapper.findComponent(CurrencyField).emitted('update:modelValue')?.at(-1)?.[0]).toBe(1250);
    });
  });
});

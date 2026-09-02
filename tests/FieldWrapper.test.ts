// FieldWrapper's view-mode placeholder: when a field reports `isEmpty`, the wrapper renders the
// configured `noValueLabel` (muted) in place of the viewMode slot, so every field shows empty
// values the same way without any per-field markup.

import { describe, test, expect } from 'vitest';
import { defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { Config, FieldState } from '../src/types';
import { defaultConfig } from '../src/lib/config';
import injectionSymbols from '../src/lib/injection-symbols';
import FieldWrapper from '../src/components/FieldWrapper.vue';

const makeField = (overrides: Partial<FieldState<string | null>> = {}): FieldState<string | null> => ({
  path: [],
  pathString: '',
  rawValue: null,
  modelValue: null,
  errors: {},
  myErrors: [],
  hasError: false,
  editMode: 'view',
  isEmpty: true,
  inputEleId: 'test-id',
  label: undefined,
  required: false,
  disabled: false,
  help: undefined,
  placeholder: undefined,
  autocomplete: undefined,
  ...overrides,
});

const mountWrapper = (field: FieldState<string | null>, config?: Partial<Config>) => {
  const Parent = defineComponent({
    setup() {
      if (config) {
        provide(injectionSymbols.config, ref({ ...defaultConfig, ...config }));
      }
      return () => h(FieldWrapper, { field }, {
        input: () => h('input', { class: 'the-input' }),
        viewMode: () => h('span', { class: 'the-view' }, 'VIEW'),
      });
    },
  });
  return mount(Parent);
};

describe('FieldWrapper — empty values in view mode', () => {
  test('renders the default noValueLabel, muted, instead of the viewMode slot', () => {
    const wrapper = mountWrapper(makeField({ isEmpty: true }));
    const placeholder = wrapper.find('.vfm-no-value');
    expect(placeholder.exists()).toBe(true);
    expect(placeholder.classes()).toContain('text-muted');
    expect(placeholder.text()).toBe('(none)');
    expect(wrapper.find('.the-view').exists()).toBe(false);
    expect(wrapper.find('.the-input').exists()).toBe(false);
  });

  test('uses noValueLabel from the injected config', () => {
    const wrapper = mountWrapper(makeField({ isEmpty: true }), { noValueLabel: 'Not set' });
    expect(wrapper.find('.vfm-no-value').text()).toBe('Not set');
  });

  test('renders the viewMode slot when the field is not empty', () => {
    const wrapper = mountWrapper(makeField({ isEmpty: false, modelValue: 'x' }));
    expect(wrapper.find('.vfm-no-value').exists()).toBe(false);
    expect(wrapper.find('.the-view').text()).toBe('VIEW');
  });

  test('never renders the placeholder in edit mode', () => {
    const wrapper = mountWrapper(makeField({ isEmpty: true, editMode: 'edit' }));
    expect(wrapper.find('.vfm-no-value').exists()).toBe(false);
    expect(wrapper.find('.the-input').exists()).toBe(true);
  });
});

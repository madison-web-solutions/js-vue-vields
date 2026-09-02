// Shared behaviour tests for single-choice fields: RadioField and SelectField.
//
// Both fields use useHasChoices / useHasChoicesSingle and accept an inline `choices` prop or
// a `directory` prop backed by an injected choicesProvider. This file uses describe.each to
// run identical assertions against both, with fixture helpers that abstract the different DOM
// mechanics (radio inputs vs select element).

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { Component } from 'vue';
import type { VueWrapper, DOMWrapper } from '@vue/test-utils';
import type { Choosable, ChoicesProvider, EditMode } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import RadioField from '../src/components/RadioField.vue';
import SelectField from '../src/components/SelectField.vue';
import CustomRadioField from '../src/components/CustomRadioField.vue';
import CustomSelectField from '../src/components/CustomSelectField.vue';

const TEST_CHOICES: Choosable[] = [
  { key: 'red',   label: 'Red'   },
  { key: 'green', label: 'Green' },
  { key: 'blue',  label: 'Blue'  },
];

const mockGetAll = vi.fn();
const mockProvider: ChoicesProvider = {
  getAll: mockGetAll,
  search: vi.fn(),
  lookup: vi.fn(),
};

type ChoiceFixture = {
  label: string;
  component: Component;
  getChoiceControls: (wrapper: VueWrapper) => DOMWrapper[];
  triggerSelectAtIndex: (wrapper: VueWrapper, index: number) => Promise<void>;
  getErrorControl: (wrapper: VueWrapper) => DOMWrapper;
  // Called before getChoiceControls in count tests — use when choices only appear after interaction
  openForCount?: (wrapper: VueWrapper) => Promise<void>;
  skipTests?: string[];
};

const fixtures: ChoiceFixture[] = [
  {
    label: 'RadioField',
    component: RadioField,
    getChoiceControls: (w) => w.findAll('input[type="radio"]'),
    triggerSelectAtIndex: async (w, i) => { await w.findAll('input[type="radio"]')[i].trigger('change'); },
    getErrorControl: (w) => w.find('input[type="radio"]'),
  },
  {
    label: 'SelectField',
    component: SelectField,
    getChoiceControls: (w) => w.findAll('option').slice(1),
    triggerSelectAtIndex: async (w, i) => {
      (w.find('select').element as HTMLSelectElement).selectedIndex = i + 1;
      await w.find('select').trigger('change');
    },
    getErrorControl: (w) => w.find('select'),
  },
  {
    label: 'CustomRadioField',
    component: CustomRadioField,
    getChoiceControls: (w) => w.findAll('.vfm-custom-radio-item'),
    triggerSelectAtIndex: async (w, i) => { await w.findAll('.vfm-custom-radio-item')[i].trigger('click'); },
    getErrorControl: (w) => w.find('.vfm-custom-radio'),
    skipTests: ['disabled'],
  },
  {
    label: 'CustomSelectField',
    component: CustomSelectField,
    openForCount: async (w) => { await w.find('.form-select').trigger('click'); },
    getChoiceControls: (w) => w.findAll('.vfm-custom-select-item'),
    triggerSelectAtIndex: async (w, i) => {
      await w.find('.form-select').trigger('click');
      await w.findAll('.vfm-custom-select-item')[i].trigger('click');
    },
    getErrorControl: (w) => w.find('.form-select'),
    skipTests: ['disabled'],
  },
];

describe.each(fixtures)('$label', (f) => {
  beforeEach(() => {
    mockGetAll.mockResolvedValue({ status: 'found', resource: TEST_CHOICES });
  });

  const mountWithChoices = (props: Record<string, unknown> = {}) =>
    mount(f.component, { props: { choices: TEST_CHOICES, ...props } });

  const mountWithProvider = (props: Record<string, unknown> = {}) =>
    mount(f.component, {
      props,
      global: { provide: { [injectionSymbols.choicesProvider as symbol]: mockProvider } },
    });

  test('renders one control per choice', async () => {
    const wrapper = mountWithChoices();
    if (f.openForCount) { await f.openForCount(wrapper); }
    expect(f.getChoiceControls(wrapper).length).toBe(TEST_CHOICES.length);
  });

  test('selecting a choice emits its key', async () => {
    const wrapper = mountWithChoices({ modelValue: null });
    await f.triggerSelectAtIndex(wrapper, 0);
    expect(lastEmittedValue(wrapper)).toBe('red');
  });

  test('changing selection emits the new key', async () => {
    const wrapper = mountWithChoices({ modelValue: 'red' });
    await f.triggerSelectAtIndex(wrapper, 1);
    expect(lastEmittedValue(wrapper)).toBe('green');
  });

  test('choices from provider in directory mode', async () => {
    const wrapper = mountWithProvider({ directory: 'colors' });
    await flushPromises();
    if (f.openForCount) { await f.openForCount(wrapper); }
    expect(f.getChoiceControls(wrapper).length).toBe(TEST_CHOICES.length);
  });

  test('view mode shows label of selected choice', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { Field: f.component },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('green') };
      },
      template: '<Field v-model="value" :choices="choices" />',
      data: () => ({ choices: TEST_CHOICES }),
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('Green');
    expect(wrapper.find('.vfm-no-value').exists()).toBe(false);
  });

  test('view mode shows the noValueLabel (never the string "null") when nothing is selected', () => {
    const Parent = defineComponent({
      components: { Field: f.component },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(null) };
      },
      template: '<Field v-model="value" :choices="choices" />',
      data: () => ({ choices: TEST_CHOICES }),
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-no-value').text()).toBe('(none)');
    expect(wrapper.text()).not.toContain('null');
  });

  test('errors mark the control as invalid', async () => {
    const wrapper = mountWithChoices({ modelValue: null });
    expect(f.getErrorControl(wrapper).classes()).not.toContain('is-invalid');

    await wrapper.setProps({ errors: { '': ['Required'] } });
    expect(f.getErrorControl(wrapper).classes()).toContain('is-invalid');

    await wrapper.setProps({ errors: {} });
    expect(f.getErrorControl(wrapper).classes()).not.toContain('is-invalid');
  });

  test.skipIf(f.skipTests?.includes('disabled'))('disabled marks the control as disabled', async () => {
    const wrapper = mountWithChoices({ modelValue: null, disabled: false });
    expect((f.getErrorControl(wrapper).element as HTMLInputElement).disabled).toBe(false);

    await wrapper.setProps({ disabled: true });
    expect((f.getErrorControl(wrapper).element as HTMLInputElement).disabled).toBe(true);
  });
});


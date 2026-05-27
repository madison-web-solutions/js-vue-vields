import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { Choosable, ChoicesProvider, EditMode } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import CheckboxesField from '../src/components/CheckboxesField.vue';

const TEST_CHOICES: Choosable[] = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta'  },
  { key: 'c', label: 'Gamma' },
];

const checkboxes = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('input[type="checkbox"]');

// ─── Array format (default / valueIs: 'array') ───────────────────────────────

describe('CheckboxesField — array format', () => {
  test('renders one checkbox per choice', () => {
    const wrapper = mount(CheckboxesField, { props: { choices: TEST_CHOICES } });
    expect(checkboxes(wrapper).length).toBe(3);
  });

  test('reflects selected values as checked checkboxes', () => {
    const wrapper = mount(CheckboxesField, { props: { modelValue: ['a', 'c'], choices: TEST_CHOICES } });
    expect((checkboxes(wrapper)[0].element as HTMLInputElement).checked).toBe(true);
    expect((checkboxes(wrapper)[1].element as HTMLInputElement).checked).toBe(false);
    expect((checkboxes(wrapper)[2].element as HTMLInputElement).checked).toBe(true);
  });

  test('checking an unchecked box appends its key to the emitted array', async () => {
    const wrapper = mount(CheckboxesField, { props: { modelValue: ['c'], choices: TEST_CHOICES } });
    await checkboxes(wrapper)[0].trigger('change');
    expect(lastEmittedValue(wrapper)).toEqual(['c', 'a']);
  });

  test('unchecking a checked box removes its key from the emitted array', async () => {
    const wrapper = mount(CheckboxesField, { props: { modelValue: ['a', 'c'], choices: TEST_CHOICES } });
    await checkboxes(wrapper)[0].trigger('change');
    expect(lastEmittedValue(wrapper)).toEqual(['c']);
  });

  test('no checkboxes are checked when value is an empty array', () => {
    const wrapper = mount(CheckboxesField, { props: { modelValue: [], choices: TEST_CHOICES } });
    for (const cb of checkboxes(wrapper)) {
      expect((cb.element as HTMLInputElement).checked).toBe(false);
    }
  });
});

// ─── Object format (valueIs: 'object') ───────────────────────────────────────

describe('CheckboxesField — object format', () => {
  const mountObj = (props: Record<string, unknown> = {}) =>
    mount(CheckboxesField, { props: { choices: TEST_CHOICES, valueIs: 'object', ...props } });

  test('reflects selected values from a boolean map', () => {
    const wrapper = mountObj({ modelValue: { a: true, b: false, c: true } });
    expect((checkboxes(wrapper)[0].element as HTMLInputElement).checked).toBe(true);
    expect((checkboxes(wrapper)[1].element as HTMLInputElement).checked).toBe(false);
    expect((checkboxes(wrapper)[2].element as HTMLInputElement).checked).toBe(true);
  });

  test('checking an unchecked box emits a map with that key set to true', async () => {
    const wrapper = mountObj({ modelValue: { a: false, b: false, c: false } });
    await checkboxes(wrapper)[0].trigger('change');
    expect(lastEmittedValue(wrapper)).toEqual({ a: true, b: false, c: false });
  });

  test('unchecking a checked box emits a map with that key set to false', async () => {
    const wrapper = mountObj({ modelValue: { a: true, b: false, c: false } });
    await checkboxes(wrapper)[0].trigger('change');
    expect(lastEmittedValue(wrapper)).toEqual({ a: false, b: false, c: false });
  });
});

// ─── Additional behaviours ────────────────────────────────────────────────────

describe('CheckboxesField', () => {
  test('inline prop adds margin class to each choice wrapper', () => {
    const withoutInline = mount(CheckboxesField, { props: { choices: TEST_CHOICES } });
    expect(withoutInline.find('.me-3').exists()).toBe(false);

    const withInline = mount(CheckboxesField, { props: { choices: TEST_CHOICES, inline: true } });
    expect(withInline.find('.me-3').exists()).toBe(true);
  });

  test('view mode shows each choice label with Yes / No', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref(['a']), choices: TEST_CHOICES };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" />',
    });
    const wrapper = mount(Parent);
    const text = wrapper.text();
    expect(text).toContain('Alpha');
    expect(text).toContain('Yes');
    expect(text).toContain('Beta');
    expect(text).toContain('No');
  });

  test('trueLabel and falseLabel props customise the view mode labels', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref(['a']), choices: TEST_CHOICES };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" trueLabel="On" falseLabel="Off" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('On');
    expect(wrapper.text()).toContain('Off');
    expect(wrapper.text()).not.toContain('Yes');
  });

  test('choices from provider in directory mode', async () => {
    const mockGetAll = vi.fn().mockResolvedValue({ status: 'found', resource: TEST_CHOICES });
    const mockProvider: ChoicesProvider = { getAll: mockGetAll, search: vi.fn(), lookup: vi.fn() };
    const wrapper = mount(CheckboxesField, {
      props: { directory: 'letters' },
      global: { provide: { [injectionSymbols.choicesProvider as symbol]: mockProvider } },
    });
    await flushPromises();
    expect(checkboxes(wrapper).length).toBe(3);
  });

  test('disabled prop disables all checkboxes', async () => {
    const wrapper = mount(CheckboxesField, { props: { choices: TEST_CHOICES, disabled: false } });
    for (const cb of checkboxes(wrapper)) {
      expect((cb.element as HTMLInputElement).disabled).toBe(false);
    }
    await wrapper.setProps({ disabled: true });
    for (const cb of checkboxes(wrapper)) {
      expect((cb.element as HTMLInputElement).disabled).toBe(true);
    }
  });
});

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

  test('columns prop lays the choices out in a column container with column-count set', () => {
    const wrapper = mount(CheckboxesField, { props: { choices: TEST_CHOICES, columns: 3 } });
    const cols = wrapper.find('.vfm-checkboxes-columns');
    expect(cols.exists()).toBe(true);
    expect((cols.element as HTMLElement).style.columnCount).toBe('3');
    expect(cols.findAll('.vfm-checkboxes-item').length).toBe(3);
  });

  test('columns of 1 or undefined does not use the column layout', () => {
    expect(mount(CheckboxesField, { props: { choices: TEST_CHOICES } }).find('.vfm-checkboxes-columns').exists()).toBe(false);
    expect(mount(CheckboxesField, { props: { choices: TEST_CHOICES, columns: 1 } }).find('.vfm-checkboxes-columns').exists()).toBe(false);
  });

  test('columns takes precedence over inline', () => {
    const wrapper = mount(CheckboxesField, { props: { choices: TEST_CHOICES, columns: 2, inline: true } });
    expect(wrapper.find('.vfm-checkboxes-columns').exists()).toBe(true);
    expect(wrapper.find('.d-flex').exists()).toBe(false);
    expect(wrapper.find('.me-3').exists()).toBe(false);
  });

  test('columns also applies to the view mode list', () => {
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(['a']), choices: TEST_CHOICES };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" :columns="2" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-checkboxes-columns').exists()).toBe(true);
    expect(wrapper.text()).toContain('Yes');
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

  test.each([
    { valueIs: 'array',  value: ['c', 'a'] },
    { valueIs: 'object', value: { a: true, b: false, c: true } },
  ])('viewModeDisplay="selected" shows only the selected choices as tokens, in choices order (valueIs: $valueIs)', ({ valueIs, value }) => {
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(value), choices: TEST_CHOICES, valueIs };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" :valueIs="valueIs" viewModeDisplay="selected" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.findAll('.vfm-token-content').map((el) => el.text().trim())).toEqual(['Alpha', 'Gamma']);
    expect(wrapper.text()).not.toContain('Beta');
    expect(wrapper.text()).not.toContain('Yes');
    expect(wrapper.text()).not.toContain('No');
  });

  test('viewModeDisplay="selected" renders the label slot for each token', () => {
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(['b']), choices: TEST_CHOICES };
      },
      template: `<CheckboxesField v-model="value" :choices="choices" viewModeDisplay="selected">
        <template #label="{ choice }">[{{ choice.key }}] {{ choice.label }}</template>
      </CheckboxesField>`,
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-token-content').text()).toBe('[b] Beta');
  });

  test('viewModeDisplay="selected" still shows the noValueLabel when nothing is selected', () => {
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref([]), choices: TEST_CHOICES };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" viewModeDisplay="selected" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-no-value').text()).toBe('(none)');
    expect(wrapper.find('.vfm-token').exists()).toBe(false);
  });

  test('viewModeDisplay="all" is the same as the default (every choice with Yes / No)', () => {
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(['a']), choices: TEST_CHOICES };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" viewModeDisplay="all" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-token').exists()).toBe(false);
    expect(wrapper.text()).toContain('Beta');
    expect(wrapper.text()).toContain('No');
  });

  test('viewModeDisplay="selected" has no effect in edit mode', () => {
    const wrapper = mount(CheckboxesField, { props: { modelValue: ['a'], choices: TEST_CHOICES, viewModeDisplay: 'selected' } });
    expect(checkboxes(wrapper).length).toBe(3);
    expect(wrapper.find('.vfm-token').exists()).toBe(false);
  });

  test.each([
    { valueIs: 'array',  value: [] },
    { valueIs: 'object', value: { a: false, b: false } },
  ])('view mode shows the noValueLabel when nothing is selected (valueIs: $valueIs)', ({ valueIs, value }) => {
    const Parent = defineComponent({
      components: { CheckboxesField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(value), choices: TEST_CHOICES, valueIs };
      },
      template: '<CheckboxesField v-model="value" :choices="choices" :valueIs="valueIs" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-no-value').text()).toBe('(none)');
    expect(wrapper.text()).not.toContain('Alpha');
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

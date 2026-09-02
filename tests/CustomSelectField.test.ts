import { describe, test, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, provide, ref } from 'vue';
import type { Choosable, ChoicesProvider, EditMode } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import CustomSelectField from '../src/components/CustomSelectField.vue';

const TEST_CHOICES: Choosable[] = [
  { key: 'red',   label: 'Red'   },
  { key: 'green', label: 'Green' },
  { key: 'blue',  label: 'Blue'  },
];

const trigger = (wrapper: ReturnType<typeof mount>) => wrapper.find('.form-select');
const dropdown = (wrapper: ReturnType<typeof mount>) => wrapper.find('.vfm-custom-select-items');
const items = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.vfm-custom-select-item');
const nullItem = (wrapper: ReturnType<typeof mount>) => wrapper.find('.vfm-custom-select-null-item');

describe('CustomSelectField', () => {
  test('dropdown is closed by default and opens on click', async () => {
    const wrapper = mount(CustomSelectField, { props: { choices: TEST_CHOICES } });
    expect(dropdown(wrapper).exists()).toBe(false);
    await trigger(wrapper).trigger('click');
    expect(dropdown(wrapper).exists()).toBe(true);
    expect(items(wrapper).length).toBe(3);
  });

  test('clicking the trigger again closes the dropdown', async () => {
    const wrapper = mount(CustomSelectField, { props: { choices: TEST_CHOICES } });
    await trigger(wrapper).trigger('click');
    expect(dropdown(wrapper).exists()).toBe(true);
    await trigger(wrapper).trigger('click');
    expect(dropdown(wrapper).exists()).toBe(false);
  });

  test('renders custom slot content with choice slot prop', async () => {
    const wrapper = mount(CustomSelectField, {
      props: { modelValue: 'red', choices: TEST_CHOICES },
      slots: {
        default: ({ choice }: { choice: Choosable }) =>
          h('span', { class: 'custom-item' }, choice.label),
      },
    });
    // The default slot also renders in the trigger for the current value, so scope to the dropdown.
    await trigger(wrapper).trigger('click');
    const dropdownItems = wrapper.find('.vfm-custom-select-items').findAll('.custom-item');
    expect(dropdownItems.length).toBe(3);
    expect(dropdownItems[0].text()).toBe('Red');
  });

  test('clicking a choice emits its key and closes the dropdown', async () => {
    const wrapper = mount(CustomSelectField, { props: { modelValue: null, choices: TEST_CHOICES } });
    await trigger(wrapper).trigger('click');
    await items(wrapper)[0].trigger('click');
    expect(lastEmittedValue(wrapper)).toBe('red');
    expect(dropdown(wrapper).exists()).toBe(false);
  });

  test('clicking the null option emits null and closes the dropdown', async () => {
    const wrapper = mount(CustomSelectField, { props: { modelValue: 'red', choices: TEST_CHOICES } });
    await trigger(wrapper).trigger('click');
    await nullItem(wrapper).trigger('click');
    expect(lastEmittedValue(wrapper)).toBe(null);
    expect(dropdown(wrapper).exists()).toBe(false);
  });

  test('null option is hidden when required and a value is selected', async () => {
    const wrapper = mount(CustomSelectField, {
      props: { modelValue: 'red', choices: TEST_CHOICES, required: true },
    });
    await trigger(wrapper).trigger('click');
    expect(nullItem(wrapper).exists()).toBe(false);
  });

  test('disabled prop adds disabled class and prevents the dropdown from opening', async () => {
    const wrapper = mount(CustomSelectField, {
      props: { modelValue: null, choices: TEST_CHOICES, disabled: false },
    });
    expect(wrapper.find('.vfm-custom-select').attributes('data-vfm-disabled')).toBeUndefined();

    await wrapper.setProps({ disabled: true });
    expect(wrapper.find('.vfm-custom-select').attributes('data-vfm-disabled')).toBeDefined();
    await trigger(wrapper).trigger('click');
    expect(dropdown(wrapper).exists()).toBe(false);

    await wrapper.setProps({ disabled: false });
    expect(wrapper.find('.vfm-custom-select').attributes('data-vfm-disabled')).toBeUndefined();
  });

  test('view mode shows label of selected choice', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { CustomSelectField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('green'), choices: TEST_CHOICES };
      },
      template: '<CustomSelectField v-model="value" :choices="choices" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('Green');
  });

  test('view mode shows the noValueLabel (not the placeholder) when nothing is selected', () => {
    const Parent = defineComponent({
      components: { CustomSelectField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(null), choices: TEST_CHOICES };
      },
      template: '<CustomSelectField v-model="value" :choices="choices" placeholder="Pick one" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.vfm-no-value').text()).toBe('(none)');
    expect(wrapper.text()).not.toContain('Pick one');
  });

  test('drops upward when there is not enough room below the trigger', async () => {
    const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 750 });

    const wrapper = mount(CustomSelectField, {
      attachTo: document.body,
      props: { choices: TEST_CHOICES },
    });

    const containerEl = wrapper.find('.vfm-custom-select').element as HTMLElement;
    containerEl.getBoundingClientRect = () => ({
      top: 700, bottom: 730, left: 0, right: 100, width: 100, height: 30, x: 0, y: 700,
      toJSON: () => ({}),
    } as DOMRect);

    await trigger(wrapper).trigger('click');

    const items = dropdown(wrapper);
    expect(items.exists()).toBe(true);
    expect(items.classes()).toContain('vfm-drop-up');
    expect((items.element as HTMLElement).style.maxHeight).toBe('256px');

    wrapper.unmount();
    if (originalInnerHeight) {
      Object.defineProperty(window, 'innerHeight', originalInnerHeight);
    }
  });

  test('drops downward when there is plenty of room below the trigger', async () => {
    const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 750 });

    const wrapper = mount(CustomSelectField, {
      attachTo: document.body,
      props: { choices: TEST_CHOICES },
    });

    const containerEl = wrapper.find('.vfm-custom-select').element as HTMLElement;
    containerEl.getBoundingClientRect = () => ({
      top: 20, bottom: 50, left: 0, right: 100, width: 100, height: 30, x: 0, y: 20,
      toJSON: () => ({}),
    } as DOMRect);

    await trigger(wrapper).trigger('click');

    const items = dropdown(wrapper);
    expect(items.classes()).not.toContain('vfm-drop-up');

    wrapper.unmount();
    if (originalInnerHeight) {
      Object.defineProperty(window, 'innerHeight', originalInnerHeight);
    }
  });

  test('choices from provider in directory mode', async () => {
    const mockGetAll = vi.fn().mockResolvedValue({ status: 'found', resource: TEST_CHOICES });
    const mockProvider: ChoicesProvider = { getAll: mockGetAll, search: vi.fn(), lookup: vi.fn() };
    const wrapper = mount(CustomSelectField, {
      props: { directory: 'colors' },
      global: { provide: { [injectionSymbols.choicesProvider as symbol]: mockProvider } },
    });
    await flushPromises();
    await trigger(wrapper).trigger('click');
    expect(items(wrapper).length).toBe(3);
  });
});

import { describe, test, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, provide, ref } from 'vue';
import type { Choosable, ChoicesProvider, EditMode } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import CustomRadioField from '../src/components/CustomRadioField.vue';

const TEST_CHOICES: Choosable[] = [
  { key: 'red',   label: 'Red'   },
  { key: 'green', label: 'Green' },
  { key: 'blue',  label: 'Blue'  },
];

const items = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.vfm-custom-radio-item');

describe('CustomRadioField', () => {
  test('renders one item per choice showing default slot content', () => {
    const wrapper = mount(CustomRadioField, { props: { choices: TEST_CHOICES } });
    const els = items(wrapper);
    expect(els.length).toBe(3);
    expect(els[0].text()).toContain('Red');
    expect(els[1].text()).toContain('Green');
    expect(els[2].text()).toContain('Blue');
  });

  test('renders custom slot content with choice and selected slot props', () => {
    const wrapper = mount(CustomRadioField, {
      props: { modelValue: 'red', choices: TEST_CHOICES },
      slots: {
        default: ({ choice, selected }: { choice: Choosable; selected: boolean }) =>
          h('span', { class: selected ? 'is-selected' : 'not-selected' }, choice.label),
      },
    });
    expect(wrapper.findAll('.is-selected').length).toBe(1);
    expect(wrapper.find('.is-selected').text()).toBe('Red');
    expect(wrapper.findAll('.not-selected').length).toBe(2);
  });

  test('clicking a choice emits its key', async () => {
    const wrapper = mount(CustomRadioField, { props: { modelValue: null, choices: TEST_CHOICES } });
    await items(wrapper)[1].trigger('click');
    expect(lastEmittedValue(wrapper)).toBe('green');
  });

  test('disabled prop adds disabled class and prevents selection', async () => {
    const wrapper = mount(CustomRadioField, {
      props: { modelValue: null, choices: TEST_CHOICES, disabled: false },
    });
    expect(wrapper.find('.vfm-custom-radio').attributes('data-vfm-disabled')).toBeUndefined();

    await wrapper.setProps({ disabled: true });
    expect(wrapper.find('.vfm-custom-radio').attributes('data-vfm-disabled')).toBeDefined();
    await items(wrapper)[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();

    await wrapper.setProps({ disabled: false });
    expect(wrapper.find('.vfm-custom-radio').attributes('data-vfm-disabled')).toBeUndefined();
  });

  test('view mode shows label of selected choice', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { CustomRadioField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('green'), choices: TEST_CHOICES };
      },
      template: '<CustomRadioField v-model="value" :choices="choices" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toContain('Green');
  });

  test('choices from provider in directory mode', async () => {
    const mockGetAll = vi.fn().mockResolvedValue({ status: 'found', resource: TEST_CHOICES });
    const mockProvider: ChoicesProvider = { getAll: mockGetAll, search: vi.fn(), lookup: vi.fn() };
    const wrapper = mount(CustomRadioField, {
      props: { directory: 'colors' },
      global: { provide: { [injectionSymbols.choicesProvider as symbol]: mockProvider } },
    });
    await flushPromises();
    expect(items(wrapper).length).toBe(3);
  });
});

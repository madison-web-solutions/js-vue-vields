import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { ChoicesProvider, EditMode } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import SearchField from '../src/components/SearchField.vue';

// SearchField always needs a provider — it has no inline choices prop.
// lookup() is called on mount when modelValue is set (watchEffect).
// search() is called after the 300ms debounce timer (useSearches.searchDebounced).

const mockLookup = vi.fn();
const mockSearch = vi.fn();
const mockProvider: ChoicesProvider = {
  getAll: vi.fn(),
  lookup: mockLookup,
  search: mockSearch,
};

const mountWithProvider = (props: Record<string, unknown> = {}) =>
  mount(SearchField, {
    props: { directory: 'colors', ...props },
    global: { provide: { [injectionSymbols.choicesProvider as symbol]: mockProvider } },
  });

describe('SearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Default: lookup returns not-found so no label is shown unless overridden
    mockLookup.mockResolvedValue({ status: 'not-found' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('shows placeholder text when no value is set', async () => {
    const wrapper = mountWithProvider({ modelValue: null, placeholder: 'Pick a colour' });
    await flushPromises();
    expect(wrapper.find('.form-control').text()).toContain('Pick a colour');
  });

  test('shows the current value label after lookup resolves', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { key: 'red', label: 'Red' } });
    const wrapper = mountWithProvider({ modelValue: 'red' });
    await flushPromises();
    expect(wrapper.find('.form-control').text()).toContain('Red');
  });

  test('clicking the search button opens the search interface', async () => {
    const wrapper = mountWithProvider({ modelValue: null });
    expect(wrapper.find('input[type="text"]').exists()).toBe(false);
    await wrapper.find('.btn-outline-primary').trigger('click');
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
  });

  test('search results appear after typing and debounce', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [{ key: 'red', label: 'Red' }] });
    const wrapper = mountWithProvider({ modelValue: null });
    await wrapper.find('.btn-outline-primary').trigger('click');
    await wrapper.find('input[type="text"]').setValue('red');
    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(wrapper.findAll('.list-group-item').length).toBe(1);
    expect(wrapper.find('.list-group-item').text()).toContain('Red');
  });

  test('clicking a search result emits its key and closes the search interface', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [{ key: 'red', label: 'Red' }] });
    const wrapper = mountWithProvider({ modelValue: null });
    await wrapper.find('.btn-outline-primary').trigger('click');
    await wrapper.find('input[type="text"]').setValue('red');
    vi.advanceTimersByTime(300);
    await flushPromises();
    await wrapper.find('.list-group-item').trigger('click');
    expect(lastEmittedValue(wrapper)).toBe('red');
    expect(wrapper.find('input[type="text"]').exists()).toBe(false);
  });

  test('clear button emits null', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { key: 'red', label: 'Red' } });
    const wrapper = mountWithProvider({ modelValue: 'red' });
    await flushPromises();
    await wrapper.find('.btn-outline-danger').trigger('click');
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('more button loads the next page of results', async () => {
    mockSearch
      .mockResolvedValueOnce({ page: 1, hasMore: true,  suggestions: [{ key: 'red',   label: 'Red'   }] })
      .mockResolvedValueOnce({ page: 2, hasMore: false, suggestions: [{ key: 'green', label: 'Green' }] });
    const wrapper = mountWithProvider({ modelValue: null });
    await wrapper.find('.btn-outline-primary').trigger('click');
    await wrapper.find('input[type="text"]').setValue('col');
    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(wrapper.findAll('.list-group-item').length).toBe(1);
    expect(wrapper.find('.btn-link').text()).toContain('more');
    await wrapper.find('.btn-link').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.list-group-item').length).toBe(2);
    expect(wrapper.find('.btn-link').exists()).toBe(false);
  });

  test('view mode shows the label from lookup', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { key: 'red', label: 'Red' } });
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { SearchField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        provide(injectionSymbols.choicesProvider, mockProvider);
        return { value: ref('red') };
      },
      template: '<SearchField v-model="value" directory="colors" />',
    });
    const wrapper = mount(Parent);
    await flushPromises();
    expect(wrapper.text()).toContain('Red');
  });
});

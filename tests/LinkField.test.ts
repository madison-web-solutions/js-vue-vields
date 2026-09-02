import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { EditMode, LinkAlias, LinksProvider } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import LinkField from '../src/components/LinkField.vue';

// LinkField has two render modes:
//  - No provider: shows a plain URL text input (no scheme selector)
//  - With provider: shows a scheme selector + display div + search button
//
// Search uses a 300ms debounce (useSearches), so fake timers are required throughout.

const mockLookup = vi.fn();
const mockSearch = vi.fn();
const mockProvider: LinksProvider = {
  schemes: [
    { key: 'page', label: 'Page' },
    { key: 'post', label: 'Post' },
  ],
  lookup: mockLookup,
  search: mockSearch,
};

const mountWithProvider = (props: Record<string, unknown> = {}) =>
  mount(LinkField, {
    props,
    global: { provide: { [injectionSymbols.linksProvider as symbol]: mockProvider } },
  });

// Open the search interface and type a query that is long enough to trigger a search.
const openAndSearch = async (wrapper: ReturnType<typeof mount>, query: string) => {
  await wrapper.find('.btn-outline-primary').trigger('click');
  await wrapper.find('input[type="text"]').setValue(query);
  vi.advanceTimersByTime(300);
  await flushPromises();
};

describe('LinkField — no provider', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('renders a URL text input with no scheme selector', () => {
    const wrapper = mount(LinkField, { props: {} });
    expect(wrapper.find('select').exists()).toBe(false);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
  });

  test('typing a URL emits url:value', async () => {
    const wrapper = mount(LinkField, { props: { modelValue: null } });
    await wrapper.find('input[type="text"]').setValue('https://example.com');
    expect(lastEmittedValue(wrapper)).toBe('url:https://example.com');
  });

  test('clearing the URL input emits null', async () => {
    const wrapper = mount(LinkField, { props: { modelValue: 'url:https://example.com' } });
    await wrapper.find('input[type="text"]').setValue('');
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('focus() focuses the URL input', () => {
    const wrapper = mount(LinkField, { props: {}, attachTo: document.body });
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(wrapper.find('input[type="text"]').element);
    wrapper.unmount();
  });

  test('the URL input carries the field id, so the label points at it', () => {
    const wrapper = mount(LinkField, { props: { label: 'Link' } });
    const inputId = wrapper.find('input[type="text"]').attributes('id');
    expect(inputId).toBeTruthy();
    expect(wrapper.find('label').attributes('for')).toBe(inputId);
  });
});

describe('LinkField — with provider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockLookup.mockResolvedValue({ status: 'not-found' });
  });
  afterEach(() => { vi.useRealTimers(); });

  test('renders scheme selector with provider schemes and exactly one URL option', () => {
    const wrapper = mountWithProvider();
    const options = wrapper.findAll('.vfm-link-field-scheme-select option');
    expect(options.length).toBe(3);
    const urlOptions = options.filter(o => o.element.value === 'url');
    expect(urlOptions.length).toBe(1);
  });

  test('shows the label after lookup resolves for an initial non-URL value', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { scheme: 'post', key: '99', label: 'Post 99', url: '/post/99' } });
    const wrapper = mountWithProvider({ modelValue: 'post:99' });
    await flushPromises();
    expect(wrapper.find('.form-control').text()).toContain('Post 99');
  });

  test('legacy plain URL value loads as URL scheme when provider is present', () => {
    const wrapper = mountWithProvider({ modelValue: 'https://example.com' });
    // Bug fix: 'https' is not a known scheme, so it should fall through to URL mode
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('https://example.com');
  });

  test('search flow: open → type → results appear → select → emits scheme:key', async () => {
    mockSearch.mockResolvedValue({
      page: 1, hasMore: false,
      suggestions: [{ scheme: 'page', key: '42', label: 'Home', url: '/' }],
    });
    const wrapper = mountWithProvider({ modelValue: 'page:' });
    await openAndSearch(wrapper, 'hom');
    expect(wrapper.findAll('.list-group-item').length).toBe(1);
    expect(wrapper.find('.list-group-item').text()).toContain('Home');
    await wrapper.find('.list-group-item').trigger('click');
    expect(lastEmittedValue(wrapper)).toBe('page:42');
    expect(wrapper.find('input[type="text"]').exists()).toBe(false);
  });

  test('search with no results shows the no-results message', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [] });
    const wrapper = mountWithProvider({ modelValue: 'page:' });
    await openAndSearch(wrapper, 'xyz');
    expect(wrapper.text()).toContain('No results');
  });

  test('isSearching clears when search text is fewer than 3 characters (regression)', async () => {
    const wrapper = mountWithProvider({ modelValue: 'page:' });
    await wrapper.find('.btn-outline-primary').trigger('click');
    await wrapper.find('input[type="text"]').setValue('ab');
    vi.advanceTimersByTime(300);
    await flushPromises();
    // "Searching..." should NOT be shown — isSearching should be false
    expect(wrapper.text()).not.toContain('Searching');
  });

  // In a non-URL scheme the value is shown in a read-only div which can't take focus, so focus()
  // goes to the search button — the control the user needs in order to change the value.
  test('focus() focuses the search button when the scheme is not URL', async () => {
    const wrapper = mount(LinkField, {
      props: { modelValue: 'page:42' },
      global: { provide: { [injectionSymbols.linksProvider as symbol]: mockProvider } },
      attachTo: document.body,
    });
    await flushPromises();
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(wrapper.find('.btn-outline-primary').element);
    wrapper.unmount();
  });

  test('focus() follows the scheme selector back to the URL input', async () => {
    const wrapper = mount(LinkField, {
      props: { modelValue: 'page:42' },
      global: { provide: { [injectionSymbols.linksProvider as symbol]: mockProvider } },
      attachTo: document.body,
    });
    await flushPromises();
    await wrapper.find('.vfm-link-field-scheme-select').setValue('url');
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(wrapper.find('input[type="text"]').element);
    wrapper.unmount();
  });

  test('clear button in URL mode emits null', async () => {
    const wrapper = mountWithProvider({ modelValue: 'url:https://example.com' });
    await wrapper.find('.btn-outline-danger').trigger('click');
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  // Clearing a typed link emits null (the field has no value) but the scheme selector stays put.
  // Uses a reactive parent so the null round-trip fires, proving the scheme is not reset to 'url'.
  test('clear button on a typed link emits null but keeps the scheme', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { scheme: 'post', key: '1', label: 'Post', url: '/' } });
    const Parent = defineComponent({
      components: { LinkField },
      setup() {
        provide(injectionSymbols.linksProvider, mockProvider);
        return { value: ref<string | null>('post:1') };
      },
      template: '<LinkField v-model="value" />',
    });
    const wrapper = mount(Parent);
    await flushPromises();
    expect(wrapper.find('.form-control').text()).toContain('Post');

    await wrapper.find('.btn-outline-danger').trigger('click');
    await flushPromises();

    expect(lastEmittedValue(wrapper.findComponent(LinkField))).toBeNull();
    expect(wrapper.find('.form-control').text()).toBe('');
    // Scheme selector remains on 'post'
    expect((wrapper.find('.vfm-link-field-scheme-select').element as HTMLSelectElement).value).toBe('post');
  });

  test('view mode shows the label from lookup', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { scheme: 'page', key: '1', label: 'About', url: '/about' } });
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { LinkField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        provide(injectionSymbols.linksProvider, mockProvider);
        return { value: ref('page:1') };
      },
      template: '<LinkField v-model="value" />',
    });
    const wrapper = mount(Parent);
    await flushPromises();
    expect(wrapper.text()).toContain('About');
  });

  test('disabled: search and clear buttons have disabled attribute', () => {
    const wrapper = mountWithProvider({ modelValue: 'post:1', disabled: true });
    expect(wrapper.find('.btn-outline-primary').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.btn-outline-danger').attributes('disabled')).toBeDefined();
  });

  test('errors: is-invalid applied to the display div and removed when cleared', async () => {
    const wrapper = mountWithProvider({ modelValue: 'post:1' });
    expect(wrapper.find('.form-control').classes()).not.toContain('is-invalid');
    await wrapper.setProps({ errors: { '': ['Required'] } });
    expect(wrapper.find('.form-control').classes()).toContain('is-invalid');
    await wrapper.setProps({ errors: {} });
    expect(wrapper.find('.form-control').classes()).not.toContain('is-invalid');
  });

  test('errors: is-invalid applied to the URL input in URL mode', async () => {
    const wrapper = mountWithProvider({ modelValue: null });
    // Default scheme is url, so we get the text input
    await wrapper.setProps({ errors: { '': ['Required'] } });
    expect(wrapper.find('input[type="text"]').classes()).toContain('is-invalid');
  });

  // Uses a reactive parent so the modelValue round-trip (watch([schemeKey, aliasKey]) → emit →
  // parent updates prop → watch(modelValue)) actually fires, proving savedAliasKeys survives it.
  test('switching scheme clears the selection; switching back restores it', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { scheme: 'post', key: '99', label: 'Post 99', url: '/' } });
    const Parent = defineComponent({
      components: { LinkField },
      setup() {
        provide(injectionSymbols.linksProvider, mockProvider);
        const value = ref<string | null>('post:99');
        return { value };
      },
      template: '<LinkField v-model="value" />',
    });
    const wrapper = mount(Parent);
    await flushPromises();

    // Initial state: display shows the looked-up label
    expect(wrapper.find('.form-control').text()).toContain('Post 99');

    // Switch to 'page' — selection should be cleared
    await wrapper.find('.vfm-link-field-scheme-select').setValue('page');
    await flushPromises();
    expect(wrapper.find('.form-control').text()).toBe('');

    // Switch back to 'post' — key '99' should be restored and re-looked up
    mockLookup.mockResolvedValue({ status: 'found', resource: { scheme: 'post', key: '99', label: 'Post 99', url: '/' } });
    await wrapper.find('.vfm-link-field-scheme-select').setValue('post');
    await flushPromises();
    expect(wrapper.find('.form-control').text()).toContain('Post 99');
  });
});

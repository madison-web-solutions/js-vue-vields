import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import type { Choosable, ChoicesProvider, FormValue, MessageBag } from '../src/types';
import { lastEmittedValue, settle } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import TokensField from '../src/components/TokensField.vue';

// TokensField always requires searchable prop.
// Non-searchable mode: uses a SelectField to add tokens (choices prop or directory).
// Searchable mode: uses a SearchField to add tokens (always requires directory + provider).
//
// Adding a token goes through the internal `temp` ref, which is reset via a 10ms setTimeout.
// Tests that add tokens need fake timers + settle().

const TEST_CHOICES: Choosable[] = [
  { key: 'red',   label: 'Red'   },
  { key: 'green', label: 'Green' },
  { key: 'blue',  label: 'Blue'  },
];

const mockLookup = vi.fn();
const mockProvider: ChoicesProvider = {
  getAll: vi.fn(),
  lookup: mockLookup,
  search: vi.fn(),
};

const tokens = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.vfm-token');
const tokenLabels = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.vfm-token-content').map((el) => el.text().trim());

// Select a choice from the embedded SelectField by 0-based index into TEST_CHOICES.
const selectChoice = async (wrapper: ReturnType<typeof mount>, index: number) => {
  (wrapper.find('select').element as HTMLSelectElement).selectedIndex = index + 1;
  await wrapper.find('select').trigger('change');
  await settle();
};

describe('TokensField — non-searchable', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('renders existing tokens with their labels', () => {
    const wrapper = mount(TokensField, {
      props: { modelValue: ['red', 'green'], choices: TEST_CHOICES, searchable: false },
    });
    expect(tokens(wrapper).length).toBe(2);
    expect(tokenLabels(wrapper)).toEqual(['Red', 'Green']);
  });

  test('selecting a choice from the dropdown adds it and emits the updated array', async () => {
    const wrapper = mount(TokensField, {
      props: { modelValue: [], choices: TEST_CHOICES, searchable: false },
    });
    await selectChoice(wrapper, 0);
    expect(lastEmittedValue(wrapper)).toEqual(['red']);
  });

  test('clicking the delete button removes the token and emits the updated array', async () => {
    const wrapper = mount(TokensField, {
      props: { modelValue: ['red', 'green'], choices: TEST_CHOICES, searchable: false },
    });
    await tokens(wrapper)[0].find('button').trigger('click');
    expect(lastEmittedValue(wrapper)).toEqual(['green']);
  });

  test('selecting a duplicate token does not add it again', async () => {
    const wrapper = mount(TokensField, {
      props: { modelValue: ['red'], choices: TEST_CHOICES, searchable: false },
    });
    await selectChoice(wrapper, 0);
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  test('disabled hides the select and all delete buttons', () => {
    const wrapper = mount(TokensField, {
      props: { modelValue: ['red'], choices: TEST_CHOICES, searchable: false, disabled: true },
    });
    expect(wrapper.find('select').exists()).toBe(false);
    expect(wrapper.find('.token-delete').exists()).toBe(false);
  });
});

// ─── Regression: nested in a parent context ─────────────────────────────────────
//
// The internal SelectField/SearchField used to pick a token is bound with `v-model="temp"`.
// `temp` must own its own value (be initialised to `null`, not `undefined`) — otherwise that
// keyless helper field is treated as un-owned and binds straight into TokensField's *parent*
// context, so selecting a choice overwrites the entire parent value object rather than just
// pushing onto this field's array. See the `temp` comment in TokensField.vue.

describe('TokensField — nested in a parent context', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('selecting a token updates only this field and leaves sibling values intact', async () => {
    const data = ref<FormValue>({ colors: [], other: 'keep me' });
    const errorData = ref<MessageBag>({});

    const wrapper = mount(TokensField, {
      props: { name: 'colors', choices: TEST_CHOICES, searchable: false },
      global: {
        provide: {
          [injectionSymbols.parentValue]: data,
          [injectionSymbols.parentErrors]: errorData,
        },
      },
    });

    await selectChoice(wrapper, 0);

    // The token is pushed onto this field's own array, and the sibling key is untouched —
    // i.e. the whole parent value was NOT replaced by the selected key.
    expect(data.value).toEqual({ colors: ['red'], other: 'keep me' });
    // A field bound by name writes through the parent ref, not via update:modelValue.
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });
});

// ─── Searchable mode ──────────────────────────────────────────────────────────

describe('TokensField — searchable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockLookup.mockResolvedValue({ status: 'not-found' });
  });
  afterEach(() => { vi.useRealTimers(); });

  const mountSearchable = (props: Record<string, unknown> = {}) =>
    mount(TokensField, {
      props: { searchable: true, directory: 'colors', ...props },
      global: { provide: { [injectionSymbols.choicesProvider as symbol]: mockProvider } },
    });

  test('shows token labels looked up from the provider', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { key: 'red', label: 'Red' } });
    const wrapper = mountSearchable({ modelValue: ['red'] });
    await flushPromises();
    expect(tokenLabels(wrapper)).toEqual(['Red']);
  });

  test('clicking the delete button removes a searchable token', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: { key: 'red', label: 'Red' } });
    const wrapper = mountSearchable({ modelValue: ['red'] });
    await flushPromises();
    await tokens(wrapper)[0].find('button').trigger('click');
    expect(lastEmittedValue(wrapper)).toEqual([]);
  });
});

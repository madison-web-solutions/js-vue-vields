import { describe, test, expect, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import type { Choosable, ChoicesProvider, HasChoicesFieldProps, RefsOf } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import useHasChoices from '../src/lib/useHasChoices';

// useHasChoices injects the choicesProvider, so it must run inside a component setup.
// runChoices wraps it in a host component and returns the composable's result.
const runChoices = (
  opts: { choices?: HasChoicesFieldProps['choices']; directory?: string; extraParams?: object },
  provider?: ChoicesProvider,
) => {
  const props: RefsOf<HasChoicesFieldProps> = {
    choices: ref(opts.choices),
    directory: ref(opts.directory),
    extraParams: ref(opts.extraParams),
  };
  let api!: ReturnType<typeof useHasChoices>;
  const Host = defineComponent({
    setup() {
      api = useHasChoices(props);
      return () => h('div');
    },
  });
  const wrapper = mount(Host, provider
    ? { global: { provide: { [injectionSymbols.choicesProvider as symbol]: provider } } }
    : {});
  return { api, wrapper };
};

const foundProvider = (resource: Choosable[]): ChoicesProvider => ({
  getAll: vi.fn().mockResolvedValue({ status: 'found', resource }),
  search: vi.fn(),
  lookup: vi.fn(),
});

describe('useHasChoices', () => {
  test('normalises a comma-separated string (labels via startCase)', () => {
    const { api } = runChoices({ choices: 'red, green, blue' });
    expect(api.choicesNormalized.value).toEqual([
      { key: 'red', label: 'Red' },
      { key: 'green', label: 'Green' },
      { key: 'blue', label: 'Blue' },
    ]);
  });

  test('normalises an object map of key → label', () => {
    const { api } = runChoices({ choices: { a: 'Apple', b: 'Banana' } });
    expect(api.choicesNormalized.value).toEqual([
      { key: 'a', label: 'Apple' },
      { key: 'b', label: 'Banana' },
    ]);
  });

  test('preserves an array of Choosables (string and numeric keys)', () => {
    const { api } = runChoices({ choices: [{ key: 'x', label: 'X label' }, { key: 5, label: 'Five' }] });
    expect(api.choicesNormalized.value).toEqual([
      { key: 'x', label: 'X label' },
      { key: 5, label: 'Five' },
    ]);
  });

  test('normalises an array of strings', () => {
    const { api } = runChoices({ choices: ['foo', 'bar'] });
    expect(api.choicesNormalized.value).toEqual([
      { key: 'foo', label: 'Foo' },
      { key: 'bar', label: 'Bar' },
    ]);
  });

  test('derives a label for a keyed choice that has none (runtime robustness)', () => {
    const { api } = runChoices({ choices: [{ key: 'some_key' }] as unknown as Choosable[] });
    expect(api.choicesNormalized.value).toEqual([{ key: 'some_key', label: 'Some Key' }]);
  });

  test('returns an empty list when no choices are given', () => {
    const { api } = runChoices({});
    expect(api.choicesNormalized.value).toEqual([]);
    expect(api.possibleValues.value).toEqual([]);
  });

  test('possibleValues lists the choice keys', () => {
    const { api } = runChoices({ choices: { a: 'Apple', b: 'Banana' } });
    expect(api.possibleValues.value).toEqual(['a', 'b']);
  });

  test('uses the provider results in directory mode', async () => {
    const provider = foundProvider([{ key: 'p', label: 'Provided' }]);
    const { api } = runChoices({ directory: 'things' }, provider);
    await flushPromises();
    expect(provider.getAll).toHaveBeenCalledWith('things', {});
    expect(api.choicesNormalized.value).toEqual([{ key: 'p', label: 'Provided' }]);
  });

  test('directory takes precedence over an inline choices prop', async () => {
    const provider = foundProvider([{ key: 'p', label: 'Provided' }]);
    const { api } = runChoices({ directory: 'things', choices: ['ignored'] }, provider);
    await flushPromises();
    expect(api.choicesNormalized.value).toEqual([{ key: 'p', label: 'Provided' }]);
  });
});

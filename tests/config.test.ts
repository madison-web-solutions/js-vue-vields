import { describe, test, expect } from 'vitest';
import { ref } from 'vue';
import type { Config } from '../src/types';
import { getConfigValue, getConfigRef } from '../src/lib/config';

describe('getConfigValue', () => {
  test('returns the value from the provided config when the key is present', () => {
    expect(getConfigValue({ 'textArea.numRows': 8 }, 'textArea.numRows')).toBe(8);
    expect(getConfigValue({ noValueLabel: 'Nothing' }, 'noValueLabel')).toBe('Nothing');
  });

  test('falls back to the default when the key is absent or config is undefined', () => {
    expect(getConfigValue({}, 'textArea.numRows')).toBe(4); // default
    expect(getConfigValue(undefined, 'noValueLabel')).toBe('(none)'); // default
  });

  test('a present key wins even when its value is falsy', () => {
    // 0 is falsy but present, so it must beat the default of 4
    expect(getConfigValue({ 'textArea.numRows': 0 }, 'textArea.numRows')).toBe(0);
  });
});

describe('getConfigRef', () => {
  // config is passed explicitly (3rd arg) so the inject() fallback is bypassed.
  const cfg = (overrides: Partial<Config>) => ref<Partial<Config> | undefined>(overrides);

  test('reads the key from the config ref, falling back to the default', () => {
    const config = cfg({ 'textArea.numRows': 9 });
    expect(getConfigRef('textArea.numRows', undefined, config).value).toBe(9);
    expect(getConfigRef('noValueLabel', undefined, config).value).toBe('(none)');
  });

  test('an override takes precedence over config and default', () => {
    const config = cfg({ 'textArea.numRows': 9 });
    expect(getConfigRef('textArea.numRows', 5, config).value).toBe(5);
  });

  test('a null/undefined override is ignored', () => {
    const config = cfg({ 'textArea.numRows': 9 });
    expect(getConfigRef('textArea.numRows', undefined, config).value).toBe(9);
    expect(getConfigRef('textArea.numRows', ref(undefined), config).value).toBe(9);
  });

  test('reacts to config ref changes', () => {
    const config = cfg({ 'textArea.numRows': 2 });
    const r = getConfigRef('textArea.numRows', undefined, config);
    expect(r.value).toBe(2);
    config.value = { 'textArea.numRows': 7 };
    expect(r.value).toBe(7);
  });
});

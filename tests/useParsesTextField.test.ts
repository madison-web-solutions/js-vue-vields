import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import useParsesTextField from '../src/lib/useParsesTextField';
import type { ParsesTextFieldOptions } from '../src/types';

// A representative numeric parser: parse, clamp to 0–100, format for reading/editing/null.
const numberOpts: ParsesTextFieldOptions<number> = {
  coerceNotEmpty: (s) => { const n = parseFloat(s); return isNaN(n) ? undefined : n; },
  clamp: (n) => Math.max(0, Math.min(100, n)),
  formatForReading: (n) => `${n} pts`,
  formatForEditing: (n) => String(n),
  formatNullForReading: () => '(none)',
};

const setup = (initial: number | null, opts: ParsesTextFieldOptions<number> = numberOpts) => {
  const modelValue = ref<number | null>(initial);
  const inputEle = ref<HTMLInputElement | null>(document.createElement('input'));
  const api = useParsesTextField<number>(modelValue, inputEle, opts);
  return { modelValue, inputEle, ...api };
};

// updateAfterClearing applies the value via a 10ms setTimeout, so fake timers are used throughout.
describe('useParsesTextField', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // ─── displayValue formatting ────────────────────────────────────────────────

  test('shows the null-for-reading text when value is null and not focused', () => {
    expect(setup(null).displayValue.value).toBe('(none)');
  });

  test('shows empty when value is null and focused', () => {
    const { displayValue, onFocus } = setup(null);
    onFocus();
    expect(displayValue.value).toBe('');
  });

  test('formats for reading when not focused', () => {
    expect(setup(50).displayValue.value).toBe('50 pts');
  });

  test('formats for editing when focused', () => {
    const { displayValue, onFocus } = setup(50);
    onFocus();
    expect(displayValue.value).toBe('50');
  });

  // ─── change(): parse / clamp / validate ──────────────────────────────────────

  test('clearing the input sets the value to null', () => {
    const { modelValue, inputEle, change } = setup(50);
    inputEle.value!.value = '';
    change();
    vi.advanceTimersByTime(10);
    expect(modelValue.value).toBeNull();
  });

  test('parses and clamps a valid input', () => {
    const { modelValue, inputEle, change } = setup(null);
    inputEle.value!.value = '150';
    change();
    vi.advanceTimersByTime(10);
    expect(modelValue.value).toBe(100); // clamped to the max of 100
  });

  test('strips whitespace before parsing', () => {
    const { modelValue, inputEle, change } = setup(null);
    inputEle.value!.value = '4 2';
    change();
    vi.advanceTimersByTime(10);
    expect(modelValue.value).toBe(42);
  });

  test('sets null when the input cannot be parsed', () => {
    const { modelValue, inputEle, change } = setup(50);
    inputEle.value!.value = 'abc';
    change();
    vi.advanceTimersByTime(10);
    expect(modelValue.value).toBeNull();
  });

  test('sets null when the value fails validation', () => {
    const opts = { ...numberOpts, isValid: (n: number) => Number.isInteger(n) };
    const { modelValue, inputEle, change } = setup(null, opts);
    inputEle.value!.value = '3.5';
    change();
    vi.advanceTimersByTime(10);
    expect(modelValue.value).toBeNull();
  });

  // ─── updateAfterClearing re-evaluation trick ─────────────────────────────────

  test('updateAfterClearing blanks the display, then applies the value', () => {
    const { modelValue, displayValue, updateAfterClearing } = setup(null);
    updateAfterClearing(75);
    expect(displayValue.value).toBe(''); // tempClear active during the 10ms window
    vi.advanceTimersByTime(10);
    expect(modelValue.value).toBe(75);
    expect(displayValue.value).toBe('75 pts'); // re-evaluated once the value is applied
  });
});

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import useHasMaxChars from '../src/lib/useHasMaxChars';

// useHasMaxChars has no injection, so we drive it directly with refs.

describe('useHasMaxChars', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('remainingChars is undefined when no max is set', () => {
    const { max, remainingChars } = useHasMaxChars(ref('hello'), {});
    expect(max.value).toBeUndefined();
    expect(remainingChars.value).toBeUndefined();
  });

  test('computes remaining characters as max minus length', () => {
    const { remainingChars } = useHasMaxChars(ref('hello'), { max: ref<number | undefined>(10) });
    expect(remainingChars.value).toBe(5);
  });

  test('remaining goes negative when over the limit', () => {
    const { remainingChars } = useHasMaxChars(ref('hello world'), { max: ref<number | undefined>(5) });
    expect(remainingChars.value).toBe(-6);
  });

  test('floors a fractional max and ignores a negative max', () => {
    expect(useHasMaxChars(ref(''), { max: ref<number | undefined>(4.9) }).max.value).toBe(4);
    expect(useHasMaxChars(ref(''), { max: ref<number | undefined>(-1) }).max.value).toBeUndefined();
  });

  test('showRemainingChars turns on when the value changes and off again after 1s', async () => {
    const modelValue = ref('hi');
    const { showRemainingChars } = useHasMaxChars(modelValue, { max: ref<number | undefined>(10) });
    expect(showRemainingChars.value).toBe(false);

    modelValue.value = 'hi there';
    await nextTick();
    expect(showRemainingChars.value).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(showRemainingChars.value).toBe(false);
  });
});

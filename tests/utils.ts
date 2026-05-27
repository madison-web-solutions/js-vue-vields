import { vi } from 'vitest';
import { nextTick } from 'vue';
import type { VueWrapper } from '@vue/test-utils';

const lastEmittedValue = (wrapper: VueWrapper, event = 'update:modelValue'): unknown => {
  return wrapper.emitted(event)?.at(-1)?.[0];
};

// Advance fake timers past updateAfterClearing's 10ms delay and flush Vue updates.
// Call after setValue() on any field that uses useParsesTextField.
const settle = async () => {
  vi.runAllTimers();
  await nextTick();
};

export { lastEmittedValue, settle };

import { nextTick } from 'vue';
import type { VueWrapper } from '@vue/test-utils';

const lastEmittedValue = (wrapper: VueWrapper, event = 'update:modelValue'): unknown => {
  return wrapper.emitted(event)?.at(-1)?.[0];
};

// Flush pending Vue updates. Call after setValue() on any field that uses useParsesTextField.
const settle = async () => {
  await nextTick();
};

export { lastEmittedValue, settle };

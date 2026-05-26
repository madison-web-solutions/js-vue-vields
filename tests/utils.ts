import type { VueWrapper } from '@vue/test-utils';

const lastEmittedValue = (wrapper: VueWrapper, event = 'update:modelValue'): unknown => {
  return wrapper.emitted(event)?.at(-1)?.[0];
};

export { lastEmittedValue };

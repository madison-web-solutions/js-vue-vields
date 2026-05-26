// Tests for the lens injection mechanism in useFormField. TextField is used as
// the mounting vehicle because it is the simplest field, but the behaviour
// under test is shared by every field component.

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import type { FormValue, MessageBag, NamedLens } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TextField from '../src/components/TextField.vue';

describe('NamedLens binding', () => {
  test('reads value and errors from a NamedLens, and writes back through it', async () => {
    const data = ref<Record<string, FormValue>>({ username: 'initial' });
    const errorData = ref<Record<string, MessageBag>>({});

    const valueLens: NamedLens<FormValue> = {
      lensType: 'named',
      get: (name) => data.value[name],
      set: (name, val) => { data.value[name] = val; },
      getAll: () => data.value,
    };

    const errorsLens: NamedLens<MessageBag> = {
      lensType: 'named',
      get: (name) => errorData.value[name] ?? {},
      set: (name, val) => { errorData.value[name] = val; },
      getAll: () => errorData.value,
    };

    const wrapper = mount(TextField, {
      props: { name: 'username' },
      global: {
        provide: {
          [injectionSymbols.valueLens]: valueLens,
          [injectionSymbols.errorsLens]: errorsLens,
        },
      },
    });

    // Reads initial value from the lens
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('initial');

    // Typing writes back through the lens, not via update:modelValue
    await wrapper.find('input').setValue('changed');
    expect(data.value['username']).toBe('changed');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    // External lens update is reflected in the input
    data.value['username'] = 'from outside';
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('from outside');

    // Errors injected via the lens affect the field state
    errorData.value['username'] = { '': ['Invalid username'] };
    await nextTick();
    expect(wrapper.find('input').classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Invalid username');
  });
});

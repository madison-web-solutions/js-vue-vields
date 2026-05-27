// Tests for the lens injection mechanism in useFormField. TextField is used as
// the mounting vehicle because it is the simplest field, but the behaviour
// under test is shared by every field component. Each lens type drives a different
// branch of useFormField's value/error binding:
//   FixedLens   — no name/index; get()/set(val)
//   IndexedLens — field has an `index`; get(i)/set(i, val)
//   NamedLens   — field has a `name`; get(name)/set(name, val)

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import type { FixedLens, FormValue, IndexedLens, MessageBag, NamedLens } from '../src/types';
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

describe('FixedLens binding', () => {
  test('reads value and errors from a FixedLens, and writes back through it', async () => {
    const data = ref<FormValue>('initial');
    const errorData = ref<MessageBag>({});

    const valueLens: FixedLens<FormValue> = {
      lensType: 'fixed',
      get: () => data.value,
      set: (val) => { data.value = val; },
    };

    const errorsLens: FixedLens<MessageBag> = {
      lensType: 'fixed',
      get: () => errorData.value,
      set: (val) => { errorData.value = val; },
    };

    // No name or index — a fixed lens binds the field directly to a single value.
    const wrapper = mount(TextField, {
      global: {
        provide: {
          [injectionSymbols.valueLens]: valueLens,
          [injectionSymbols.errorsLens]: errorsLens,
        },
      },
    });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('initial');

    await wrapper.find('input').setValue('changed');
    expect(data.value).toBe('changed');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    data.value = 'from outside';
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('from outside');

    errorData.value = { '': ['Something wrong'] };
    await nextTick();
    expect(wrapper.find('input').classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Something wrong');
  });
});

describe('IndexedLens binding', () => {
  test('reads/writes only the field\'s own index, and reflects external updates and errors', async () => {
    const data = ref<FormValue[]>(['zero', 'one', 'two']);
    const errorData = ref<Record<number, MessageBag>>({});

    const valueLens: IndexedLens<FormValue> = {
      lensType: 'indexed',
      get: (i) => data.value[i],
      set: (i, val) => { data.value[i] = val; },
      getAll: () => data.value,
    };

    const errorsLens: IndexedLens<MessageBag> = {
      lensType: 'indexed',
      get: (i) => errorData.value[i] ?? {},
      set: (i, val) => { errorData.value[i] = val; },
      getAll: () => Object.values(errorData.value),
    };

    const wrapper = mount(TextField, {
      props: { index: 1 },
      global: {
        provide: {
          [injectionSymbols.valueLens]: valueLens,
          [injectionSymbols.errorsLens]: errorsLens,
        },
      },
    });

    // Reads the value at its own index
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('one');

    // Writing affects only index 1, leaving siblings untouched
    await wrapper.find('input').setValue('ONE');
    expect(data.value).toEqual(['zero', 'ONE', 'two']);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    // External update at the field's index is reflected
    data.value[1] = 'from outside';
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('from outside');

    // An error at a different index is ignored; an error at the field's index shows
    errorData.value[0] = { '': ['wrong zero'] };
    await nextTick();
    expect(wrapper.find('input').classes()).not.toContain('is-invalid');

    errorData.value[1] = { '': ['wrong one'] };
    await nextTick();
    expect(wrapper.find('input').classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('wrong one');
  });
});

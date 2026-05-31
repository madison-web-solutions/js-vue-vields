// Tests for the per-level binding mechanism in useFormField. A container provides its
// value (and its flat errors bag) as the injected parentValue/parentErrors; a field
// addresses that value by a single key. TextField is the mounting vehicle (the simplest
// field) but the behaviour is shared by every field component. Each key kind addresses
// differently:
//   no name/index — the whole provided value (a keyless / single-value binding)
//   `index` (number) — the array at that index
//   `name` (string)  — the object at that key

import { describe, test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import type { FormValue, MessageBag } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TextField from '../src/components/TextField.vue';

describe('named binding (value root is an object)', () => {
  test('reads value and errors at its name, and writes back into the root', async () => {
    const data = ref<FormValue>({ username: 'initial' });
    const errorData = ref<MessageBag>({});

    const wrapper = mount(TextField, {
      props: { name: 'username' },
      global: {
        provide: {
          [injectionSymbols.parentValue]: data,
          [injectionSymbols.parentErrors]: errorData,
        },
      },
    });

    // Reads initial value from the root
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('initial');

    // Typing writes back into the root, not via update:modelValue
    await wrapper.find('input').setValue('changed');
    expect((data.value as Record<string, FormValue>)['username']).toBe('changed');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    // External root update is reflected in the input
    (data.value as Record<string, FormValue>)['username'] = 'from outside';
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('from outside');

    // The field's own error lives under its name in the flat bag
    errorData.value = { username: ['Invalid username'] };
    await nextTick();
    expect(wrapper.find('input').classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Invalid username');
  });
});

describe('fixed binding (no name/index — focuses the whole root)', () => {
  test('reads value and errors from the root value, and writes back through it', async () => {
    const data = ref<FormValue>('initial');
    const errorData = ref<MessageBag>({});

    const wrapper = mount(TextField, {
      global: {
        provide: {
          [injectionSymbols.parentValue]: data,
          [injectionSymbols.parentErrors]: errorData,
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

describe('indexed binding (value root is an array)', () => {
  test('reads/writes only the field\'s own index, and reflects external updates and errors', async () => {
    const data = ref<FormValue>(['zero', 'one', 'two']);
    const errorData = ref<MessageBag>({});

    const wrapper = mount(TextField, {
      props: { index: 1 },
      global: {
        provide: {
          [injectionSymbols.parentValue]: data,
          [injectionSymbols.parentErrors]: errorData,
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
    (data.value as FormValue[])[1] = 'from outside';
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('from outside');

    // An error at a different index is ignored; an error at the field's index shows
    errorData.value = { '0': ['wrong zero'] };
    await nextTick();
    expect(wrapper.find('input').classes()).not.toContain('is-invalid');

    errorData.value = { '1': ['wrong one'] };
    await nextTick();
    expect(wrapper.find('input').classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('wrong one');
  });
});

describe('mis-keyed field warning', () => {
  test('warns when a keyed field sits inside a scalar value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // index 0 against a scalar root: the field should have been keyless (e.g. a
      // simple RepeaterField row). This is exactly the demo footgun.
      mount(TextField, {
        props: { index: 0 },
        global: { provide: { [injectionSymbols.parentValue]: ref<FormValue>('a scalar row') } },
      });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('must be keyless');
    } finally {
      warn.mockRestore();
    }
  });

  test('stays silent for a keyless field, and for a key into a collection', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // keyless field against a scalar root — correct (binds the whole value)
      mount(TextField, {
        global: { provide: { [injectionSymbols.parentValue]: ref<FormValue>('a scalar') } },
      });
      // keyed field against an object root — correct (indexes into the collection)
      mount(TextField, {
        props: { name: 'foo' },
        global: { provide: { [injectionSymbols.parentValue]: ref<FormValue>({ foo: 'x' }) } },
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe('contradictory v-model + name warning', () => {
  test('warns when a field has both an explicit v-model and a name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      mount(TextField, { props: { modelValue: 'owned', name: 'foo' } });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('contradictory'));
    } finally {
      warn.mockRestore();
    }
  });

  test('stays silent for v-model alone, or a name alone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      mount(TextField, { props: { modelValue: 'owned' } });         // v-model, no name
      mount(TextField, {
        props: { name: 'foo' },                                      // name, no v-model
        global: { provide: { [injectionSymbols.parentValue]: ref<FormValue>({ foo: 'x' }) } },
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

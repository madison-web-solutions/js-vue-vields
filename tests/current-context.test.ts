// Tests for the getCurrentValue / getCurrentErrors helpers, which let a component
// read the value/errors of its surrounding container context via the injected
// value/errors roots. A small Probe component renders the helpers' output so the
// resolved values can be read back from the DOM. The named context uses a real
// FieldGroup (so the helpers are validated against the roots FieldGroup actually
// provides); the object/array branches inject roots directly.

import { describe, test, expect } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import type { FormValue, MessageBag } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import FieldGroup from '../src/components/FieldGroup.vue';
import { getCurrentValue, getCurrentErrors } from '../src/lib/current-context';

// Renders the helper output. `path` is captured at setup, matching real usage where
// a component passes a literal path. JSON.stringify(undefined) yields no text node,
// so an absent value reads back as an empty string.
const Probe = defineComponent({
  props: {
    valuePath: { type: String, default: undefined },
    errorPath: { type: String, default: undefined },
  },
  setup(props) {
    const value = getCurrentValue(props.valuePath);
    const errors = getCurrentErrors(props.errorPath);
    return () => h('div', [
      h('span', { class: 'val' }, JSON.stringify(value.value)),
      h('span', { class: 'err' }, JSON.stringify(errors.value)),
    ]);
  },
});

const readVal = (wrapper: VueWrapper, i = 0): FormValue => {
  const text = wrapper.findAll('.val')[i].text();
  return text === '' ? undefined : JSON.parse(text);
};
const readErr = (wrapper: VueWrapper, i = 0): MessageBag => {
  return JSON.parse(wrapper.findAll('.err')[i].text());
};

describe('getCurrentValue / getCurrentErrors in a named context (FieldGroup)', () => {
  const vals = { name: 'Ada', email: 'ada@example.com', address: { city: 'London' } };
  const errs: MessageBag = { name: ['Name required'], 'address.city': ['Unknown city'] };

  const mountInGroup = (probeProps: Record<string, unknown>) => {
    const valsRef = ref<FormValue>({ ...vals, address: { ...vals.address } });
    const errsRef = ref<MessageBag>({ ...errs });
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(
          FieldGroup,
          {
            modelValue: valsRef.value,
            errors: errsRef.value,
            'onUpdate:modelValue': (v: FormValue) => { valsRef.value = v; },
            'onUpdate:errors': (e: MessageBag) => { errsRef.value = e; },
          },
          { default: () => h(Probe, probeProps) },
        );
      },
    }));
    return { wrapper, valsRef };
  };

  test('reads a sibling value by name', () => {
    expect(readVal(mountInGroup({ valuePath: 'name' }).wrapper)).toBe('Ada');
  });

  test('reads a nested value via a dotted path', () => {
    expect(readVal(mountInGroup({ valuePath: 'address.city' }).wrapper)).toBe('London');
  });

  test('returns the whole context value when no path is given', () => {
    expect(readVal(mountInGroup({}).wrapper)).toEqual(vals);
  });

  test('scopes errors to a named field (own messages under "")', () => {
    expect(readErr(mountInGroup({ errorPath: 'name' }).wrapper)).toEqual({ '': ['Name required'] });
  });

  test('scopes errors to a nested group, stripping the prefix', () => {
    expect(readErr(mountInGroup({ errorPath: 'address' }).wrapper)).toEqual({ city: ['Unknown city'] });
  });

  test('returns the whole flat error bag when no path is given', () => {
    expect(readErr(mountInGroup({}).wrapper)).toEqual(errs);
  });

  test('is reactive — updating the group value updates the resolved value', async () => {
    const { wrapper, valsRef } = mountInGroup({ valuePath: 'name' });
    expect(readVal(wrapper)).toBe('Ada');
    valsRef.value = { ...(valsRef.value as Record<string, FormValue>), name: 'Grace' };
    await nextTick();
    expect(readVal(wrapper)).toBe('Grace');
  });
});

describe('getCurrentValue / getCurrentErrors against a directly-injected root', () => {
  const mountWithRoots = (value: FormValue, errors: MessageBag, probeProps: Record<string, unknown>) => {
    return mount(Probe, {
      props: probeProps,
      global: {
        provide: {
          [injectionSymbols.parentValue]: ref(value),
          [injectionSymbols.parentErrors]: ref(errors),
        },
      },
    });
  };

  test('reads a value by path relative to the root value', () => {
    const wrapper = mountWithRoots({ name: 'Bob' }, {}, { valuePath: 'name' });
    expect(readVal(wrapper)).toBe('Bob');
  });

  test('returns the whole root value when no path is given', () => {
    const wrapper = mountWithRoots({ name: 'Bob' }, {}, {});
    expect(readVal(wrapper)).toEqual({ name: 'Bob' });
  });

  test('scopes errors by path against the root bag', () => {
    const wrapper = mountWithRoots({}, { name: ['Required'] }, { errorPath: 'name' });
    expect(readErr(wrapper)).toEqual({ '': ['Required'] });
  });

  test('reads into an array root via a dotted path', () => {
    const wrapper = mountWithRoots([{ name: 'Ada' }, { name: 'Bob' }], {}, { valuePath: '1.name' });
    expect(readVal(wrapper)).toBe('Bob');
  });
});

describe('getCurrentValue / getCurrentErrors with no container', () => {
  test('falls back to undefined value and an empty error bag', () => {
    const wrapper = mount(Probe, { props: { valuePath: 'name', errorPath: 'name' } });
    expect(readVal(wrapper)).toBeUndefined();
    expect(readErr(wrapper)).toEqual({});
  });
});

// pickPropsFor takes a target Vue component plus a source props object, and
// returns just the keys that the target declares — useful inside wrapper
// field components. modelValue and errors are excluded by default since
// wrappers should handle those via defineModel + v-model on the target.
import { describe, test, expect } from 'vitest';
import { defineComponent } from 'vue';
import { pickPropsFor } from '../src/lib/pick-props-for';
import RepeaterField from '../src/components/RepeaterField.vue';

describe('pickPropsFor', () => {
  test('returns only the keys the target declares', () => {
    const Target = defineComponent({
      props: { name: String, label: String, custom: Boolean },
      template: '<div />',
    });
    const out = pickPropsFor(Target, { name: 'foo', label: 'bar', notDeclared: 'x' });
    expect(out).toEqual({ name: 'foo', label: 'bar' });
  });

  test('excludes modelValue and errors by default', () => {
    const Target = defineComponent({
      props: { name: String, modelValue: String, errors: Object },
      template: '<div />',
    });
    const out = pickPropsFor(Target, { name: 'a', modelValue: 'v', errors: { x: ['y'] } });
    expect(out).toEqual({ name: 'a' });
  });

  test('honours a custom excludeKeys list', () => {
    const Target = defineComponent({
      props: { name: String, open: Boolean, modelValue: String, errors: Object },
      template: '<div />',
    });
    const out = pickPropsFor(
      Target,
      { name: 'a', open: true, modelValue: 'v', errors: {} },
      ['modelValue', 'errors', 'open'],
    );
    expect(out).toEqual({ name: 'a' });
  });

  test('omits keys missing from source rather than emitting undefined', () => {
    const Target = defineComponent({
      props: { name: String, label: String },
      template: '<div />',
    });
    const out = pickPropsFor(Target, { name: 'a' });
    expect(out).toEqual({ name: 'a' });
    expect(out).not.toHaveProperty('label');
  });

  test('supports array-style props declaration', () => {
    const Target = defineComponent({
      props: ['name', 'label'],
      template: '<div />',
    });
    const out = pickPropsFor(Target, { name: 'a', label: 'b', custom: 'c' });
    expect(out).toEqual({ name: 'a', label: 'b' });
  });

  test('returns empty object when target has no props', () => {
    const Target = defineComponent({ template: '<div />' });
    expect(pickPropsFor(Target, { anything: 'goes' })).toEqual({});
  });

  // End-to-end with a real library component: pickPropsFor reads the props
  // RepeaterField declared via defineProps<T>() — including repeater-specific
  // ones (min, max, movable, appendLabel) — without us having to list them.
  test('forwards repeater-specific props when wrapping RepeaterField', () => {
    const source = {
      name: 'items',
      label: 'My Items',
      min: 1,
      max: 5,
      movable: false,
      appendLabel: 'Add Item',
      modelValue: ['should be excluded'],
      errors: { '': ['nope'] },
      mySingleColExtra: true, // a wrapper-specific prop that shouldn't forward
    };
    const out = pickPropsFor(RepeaterField, source);
    expect(out).toMatchObject({
      name: 'items',
      label: 'My Items',
      min: 1,
      max: 5,
      movable: false,
      appendLabel: 'Add Item',
    });
    expect(out).not.toHaveProperty('modelValue');
    expect(out).not.toHaveProperty('errors');
    expect(out).not.toHaveProperty('mySingleColExtra');
  });
});

// Shared behaviours (append, delete, insert, move, min/max, error reindexing,
// disabled, view mode) are tested against all three repeater variants in
// repeater-behaviors.test.ts.  This file focuses on what is specific to
// RepeaterField: the IndexedLens → FixedLens value chain in simple mode, the
// IndexedLens → FixedLens → NamedLens chain in compound mode, and per-field
// error routing through those chains.

import { describe, test, expect } from 'vitest';
import { nextTick } from 'vue';
import { mountSimpleRepeater, mountCompoundRepeater } from './repeater-utils';

describe('RepeaterField', () => {

  // ─── IndexedLens value chain (simple mode) ───────────────────────────────
  //
  // Each row's child TextField connects to the array via an IndexedLens (provided
  // by RepeaterField) chained through a FixedLens (provided by FieldArrayItem).
  // Row 0's field must read/write only index 0, row 1's field only index 1.

  test('each row displays the value from the correct array index', () => {
    const { wrapper } = mountSimpleRepeater(['alpha', 'beta']);
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('alpha');
    expect((inputs[1].element as HTMLInputElement).value).toBe('beta');
  });

  test('typing in a row updates only that index in the array', async () => {
    const { value, wrapper } = mountSimpleRepeater(['alpha', 'beta']);
    await wrapper.findAll('input')[0].setValue('changed');
    expect(value.value[0]).toBe('changed');
    expect(value.value[1]).toBe('beta'); // must be unaffected
  });

  test('externally updating an array item is reflected in the correct row input', async () => {
    const { value, wrapper } = mountSimpleRepeater(['alpha', 'beta']);
    value.value = ['alpha', 'updated'];
    await nextTick();
    expect((wrapper.findAll('input')[1].element as HTMLInputElement).value).toBe('updated');
  });

  // ─── NamedLens value chain (compound mode) ───────────────────────────────
  //
  // Compound rows add a NamedLens (provided by FieldGroup) as a third link in
  // the chain: IndexedLens → FixedLens → NamedLens.  Each named field must
  // read/write the correct key in the correct row's object.

  test('each named field displays the value from the correct key in the correct row', () => {
    const { wrapper } = mountCompoundRepeater([
      { first: 'Alice', last: 'Smith' },
      { first: 'Bob', last: 'Jones' },
    ]);
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('Alice'); // row 0, first
    expect((inputs[1].element as HTMLInputElement).value).toBe('Smith'); // row 0, last
    expect((inputs[2].element as HTMLInputElement).value).toBe('Bob');   // row 1, first
    expect((inputs[3].element as HTMLInputElement).value).toBe('Jones'); // row 1, last
  });

  test('typing in a named field updates only that key in that row', async () => {
    const { value, wrapper } = mountCompoundRepeater([
      { first: 'Alice', last: 'Smith' },
      { first: 'Bob', last: 'Jones' },
    ]);
    await wrapper.findAll('input')[3].setValue('Williams'); // row 1, last
    expect((value.value[1] as Record<string, string>)).toEqual({ first: 'Bob', last: 'Williams' });
    expect((value.value[0] as Record<string, string>)).toEqual({ first: 'Alice', last: 'Smith' }); // must be unaffected
  });

  // ─── Error routing (compound mode) ───────────────────────────────────────
  //
  // Errors are keyed with dot-delimited paths: '<rowIndex>.<fieldName>'.  Each
  // error must reach exactly the right field in the right row — not any
  // neighbouring field or row.

  test('per-field errors are shown on the correct field in the correct row', async () => {
    const { errors, wrapper } = mountCompoundRepeater([
      { first: 'Alice', last: 'Smith' },
      { first: 'Bob', last: 'Jones' },
    ]);
    errors.value = { '1.first': ['First name is required'] };
    await nextTick();

    const rows = wrapper.findAll('.vfm-repeater-item');

    expect(rows[0].find('[data-testid="field-error-messages"]').exists()).toBe(false);

    const row1Inputs = rows[1].findAll('input');
    expect(row1Inputs[0].classes()).toContain('is-invalid');
    expect(row1Inputs[1].classes()).not.toContain('is-invalid');
    expect(rows[1].find('[data-testid="field-error-messages"]').text()).toContain('First name is required');
  });
});

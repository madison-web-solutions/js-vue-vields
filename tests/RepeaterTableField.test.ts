// Shared behaviours (append, delete, insert, move, min/max, error reindexing,
// disabled, view mode) are tested against all three repeater variants in
// repeater-behaviors.test.ts.  This file focuses on what is specific to
// RepeaterTableField: column header rendering, the hasIndexCol option, named
// column slots, and the value/error wiring through those slots.

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import type { MessageBag } from '../src/types';
import RepeaterTableField from '../src/components/RepeaterTableField.vue';
import TextField from '../src/components/TextField.vue';
import { mountTableRepeater } from './repeater-utils';

describe('RepeaterTableField', () => {

  // ─── Column headers ──────────────────────────────────────────────────────

  test('renders a header cell for each column with the correct label', () => {
    const { wrapper } = mountTableRepeater();
    const headerCells = wrapper.find('.vfm-repeater-table-header').findAll('.vfm-repeater-table-cell');
    const headerText = headerCells.map(c => c.text());
    expect(headerText).toContain('First');
    expect(headerText).toContain('Last');
  });

  // When no label is provided, the component derives one from the column name
  // via startCase so the header is still human-readable without extra config.
  test('derives a header label from the column name when no label is given', () => {
    const value = ref<Record<string, string>[]>([]);
    const errors = ref<MessageBag>({});
    const cols = [{ name: 'first_name' }];
    const Parent = defineComponent({
      components: { RepeaterTableField, TextField },
      setup() { return { value, errors, cols }; },
      template: `
        <RepeaterTableField v-model="value" v-model:errors="errors" :cols="cols">
          <template #first_name><TextField name="first_name" /></template>
        </RepeaterTableField>
      `,
    });
    const wrapper = mount(Parent);
    const headerCells = wrapper.find('.vfm-repeater-table-header').findAll('.vfm-repeater-table-cell');
    const headerText = headerCells.map(c => c.text());
    expect(headerText).toContain('First Name');
  });

  // ─── Index column ────────────────────────────────────────────────────────

  // By default each row shows its 1-based row number in an index column on the
  // left, which helps users identify rows during editing.

  test('shows a 1-based row number in an index column by default', () => {
    const { wrapper } = mountTableRepeater([{ first: 'Alice', last: 'Smith' }]);
    expect(wrapper.find('.vfm-repeater-table-item-index').text()).toBe('1');
  });

  test('hides the index column when hasIndexCol is false', () => {
    const { wrapper } = mountTableRepeater([{ first: 'Alice', last: 'Smith' }], { hasIndexCol: false });
    expect(wrapper.find('.vfm-repeater-table-item-index').exists()).toBe(false);
  });

  // ─── Column slot values ──────────────────────────────────────────────────
  //
  // Each column slot is scoped to its row via an IndexedLens → FixedLens →
  // NamedLens chain (FieldGroup wraps each row's columns).  These tests verify
  // that the named column slots are correctly wired up to that chain.

  test('each column slot displays the correct value for its field and row', () => {
    const { wrapper } = mountTableRepeater([
      { first: 'Alice', last: 'Smith' },
      { first: 'Bob', last: 'Jones' },
    ]);
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('Alice'); // row 0, first
    expect((inputs[1].element as HTMLInputElement).value).toBe('Smith'); // row 0, last
    expect((inputs[2].element as HTMLInputElement).value).toBe('Bob');   // row 1, first
    expect((inputs[3].element as HTMLInputElement).value).toBe('Jones'); // row 1, last
  });

  test('typing in a column slot updates only that field in that row', async () => {
    const { value, wrapper } = mountTableRepeater([
      { first: 'Alice', last: 'Smith' },
      { first: 'Bob', last: 'Jones' },
    ]);
    await wrapper.findAll('input')[3].setValue('Williams'); // row 1, last
    expect((value.value[1] as Record<string, string>)).toEqual({ first: 'Bob', last: 'Williams' });
    expect((value.value[0] as Record<string, string>)).toEqual({ first: 'Alice', last: 'Smith' }); // must be unaffected
  });

  // ─── Error routing ───────────────────────────────────────────────────────

  test('per-column errors appear on the correct field in the correct row', async () => {
    const { errors, wrapper } = mountTableRepeater([
      { first: 'Alice', last: 'Smith' },
      { first: 'Bob', last: 'Jones' },
    ]);
    errors.value = { '1.first': ['Required'] };
    await nextTick();

    const rows = wrapper.findAll('.vfm-repeater-table-item');
    const row1Inputs = rows[1].findAll('input');
    expect(row1Inputs[0].classes()).toContain('is-invalid');     // first
    expect(row1Inputs[1].classes()).not.toContain('is-invalid'); // last
    expect(rows[0].find('[data-testid="field-error-messages"]').exists()).toBe(false);
  });
});

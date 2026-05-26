// Shared behaviour tests for all three repeater variants: simple, compound, and table.
//
// Each group runs once per fixture so coverage is not contingent on implementation details
// (i.e. whether both components happen to use the same composable).  If RepeaterTableField
// were ever rewritten, these tests would still catch any regression in append, delete, move,
// error reindexing, min/max, disabled, or view-mode behaviour.

import { describe, test, expect } from 'vitest';
import { nextTick, ref } from 'vue';
import type { EditMode } from '../src/types';
import { fixtures } from './repeater-utils';

describe.each(fixtures)('$label', (f) => {

  // ─── Initial rendering ────────────────────────────────────────────────────

  test('renders no rows for an empty initial value', () => {
    const { wrapper } = f.mount([]);
    expect(wrapper.findAll(f.rowSel).length).toBe(0);
  });

  test('renders one row per item in the initial value', () => {
    const { wrapper } = f.mount(f.makeRows(3));
    expect(wrapper.findAll(f.rowSel).length).toBe(3);
  });

  // ─── Append row ───────────────────────────────────────────────────────────

  test('clicking the append button adds a new row', async () => {
    const { value, wrapper } = f.mount(f.makeRows(1));
    await wrapper.find(f.appendSel).trigger('click');
    expect(value.value.length).toBe(2);
  });

  // Once the maximum is reached, the append button must disappear so the user
  // cannot add rows beyond the configured limit.
  test('append button is absent when the row count is at max', () => {
    const { wrapper } = f.mount(f.makeRows(2), { max: 2 });
    expect(wrapper.find(f.appendSel).exists()).toBe(false);
  });

  // ─── Delete row ───────────────────────────────────────────────────────────

  // After deleting a row, the remaining rows must stay in their correct order.
  // A bug here would silently scramble data in multi-row forms.

  test('deleting the first row shifts the remaining rows up', async () => {
    const { value, wrapper } = f.mount(f.makeRows(3));
    await wrapper.findAll('.vfm-btn-repeater-delete')[0].trigger('click');
    expect(value.value.map(f.getRowLabel)).toEqual(['b', 'c']);
  });

  test('deleting a middle row removes only that row', async () => {
    const { value, wrapper } = f.mount(f.makeRows(3));
    await wrapper.findAll('.vfm-btn-repeater-delete')[1].trigger('click');
    expect(value.value.map(f.getRowLabel)).toEqual(['a', 'c']);
  });

  // When min is set, the repeater must never fall below that row count. Clicking
  // delete on the last remaining row should clear its content but keep the row.
  test('deleting with min=1 and one row clears the row instead of removing it', async () => {
    const { value, wrapper } = f.mount(f.makeRows(1), { min: 1 });
    await wrapper.findAll('.vfm-btn-repeater-delete')[0].trigger('click');
    expect(value.value.length).toBe(1);
  });

  // ─── Insert row before ────────────────────────────────────────────────────

  test('inserting before a row places a new empty row at the correct position', async () => {
    const { value, wrapper } = f.mount(f.makeRows(2)); // ['a', 'b']
    // Insert before the second row; the new blank row slots in between
    await wrapper.findAll('.vfm-btn-repeater-insert')[1].trigger('click');
    expect(value.value.length).toBe(3);
    // Check the outer rows by label; skip the inserted row (null/empty by design)
    expect(f.getRowLabel(value.value[0])).toBe('a');
    expect(f.getRowLabel(value.value[2])).toBe('b');
  });

  // ─── Error reindexing after delete ───────────────────────────────────────
  //
  // When a row with a validation error is displayed and the user then deletes a
  // row *above* it, the error must follow the row it belongs to — not stay at
  // its old numeric index.  Without reindexing, deleting row 0 would cause an
  // error that was on row 1 (now displayed as row 0) to silently vanish.

  test('errors on subsequent rows shift down when a row is deleted', async () => {
    const { errors, wrapper } = f.mount(f.makeRows(3));
    errors.value = {
      '0': ['Error on original row 0'],
      '1': ['Error on original row 1'],
    };
    await nextTick();

    await wrapper.findAll('.vfm-btn-repeater-delete')[0].trigger('click');

    expect(errors.value['0']).toEqual(['Error on original row 1']);
    expect(errors.value['1']).toBeUndefined();
  });

  // ─── Error reindexing after insert ───────────────────────────────────────
  //
  // When a new blank row is inserted before a row that has an error, the error
  // must shift up so it stays attached to the correct row.  Without this, the
  // error would appear on the new blank row instead of the original one.

  test('errors shift up when a new row is inserted before them', async () => {
    const { errors, wrapper } = f.mount(f.makeRows(2));
    errors.value = { '0': ['Error on original row 0'] };
    await nextTick();

    await wrapper.findAll('.vfm-btn-repeater-insert')[0].trigger('click');

    expect(errors.value['0']).toBeUndefined();
    expect(errors.value['1']).toEqual(['Error on original row 0']);
  });

  // ─── Min enforcement ─────────────────────────────────────────────────────

  test('initialises with at least min rows even when the initial value has fewer', () => {
    const { wrapper } = f.mount([], { min: 2 });
    expect(wrapper.findAll(f.rowSel).length).toBe(2);
  });

  // ─── Move ─────────────────────────────────────────────────────────────────
  //
  // Moving is a two-step interaction: click the move handle (enters moving mode,
  // showing drop targets on every row), then click a target to place the row.

  test('moving a row reorders the array correctly', async () => {
    const { value, wrapper } = f.mount(f.makeRows(3));

    // Step 1: click move handle on row 0 → move targets should appear
    await wrapper.findAll('.vfm-btn-repeater-move')[0].trigger('click');
    expect(wrapper.find(f.moveTargetSel).exists()).toBe(true);

    // Step 2: drop row 0 after row 2 → 'a' should move to the end
    const rows = wrapper.findAll(f.rowSel);
    await rows[2].find(f.moveAfterSel).trigger('click');

    expect(value.value.map(f.getRowLabel)).toEqual(['b', 'c', 'a']);
  });

  // ─── Disabled ─────────────────────────────────────────────────────────────

  test('no edit controls are rendered when disabled', () => {
    const { wrapper } = f.mount(f.makeRows(2), { disabled: true });
    expect(wrapper.find('.vfm-btn-repeater-delete').exists()).toBe(false);
    expect(wrapper.find('.vfm-btn-repeater-insert').exists()).toBe(false);
    expect(wrapper.find('.vfm-btn-repeater-move').exists()).toBe(false);
    expect(wrapper.find(f.appendSel).exists()).toBe(false);
  });

  // ─── View mode ────────────────────────────────────────────────────────────

  test('no edit controls are rendered in view mode', () => {
    const { wrapper } = f.mountInViewMode(f.makeRows(2));
    expect(wrapper.find('.vfm-btn-repeater-delete').exists()).toBe(false);
    expect(wrapper.find('.vfm-btn-repeater-insert').exists()).toBe(false);
    expect(wrapper.find('.vfm-btn-repeater-move').exists()).toBe(false);
    expect(wrapper.find(f.appendSel).exists()).toBe(false);
  });
});

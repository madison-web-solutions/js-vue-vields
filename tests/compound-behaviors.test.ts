// Shared behaviour tests for both FieldGroup and CompoundField. Both own a
// CompoundFormValue and provide an identical NamedLens to children via
// useHasCompoundValue. Running these tests against both components ensures
// coverage is not contingent on the shared implementation.

import { describe, test, expect } from 'vitest';
import { nextTick } from 'vue';
import { fixtures } from './compound-utils';

describe.each(fixtures)('$label', (f) => {

  // ─── NamedLens value chain ────────────────────────────────────────────────
  //
  // The component provides a NamedLens so each child TextField with a name prop
  // reads and writes the corresponding key in the compound object.

  test('each named field displays the value from the correct key', () => {
    const { wrapper } = f.mount({ first: 'Alice', last: 'Smith' });
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('Alice');
    expect((inputs[1].element as HTMLInputElement).value).toBe('Smith');
  });

  test('typing in a field updates only that key in the object', async () => {
    const { value, wrapper } = f.mount({ first: 'Alice', last: 'Smith' });
    await wrapper.findAll('input')[0].setValue('Bob');
    expect(value.value.first).toBe('Bob');
    expect(value.value.last).toBe('Smith'); // must be unaffected
  });

  test('externally updating a value is reflected in the correct input', async () => {
    const { value, wrapper } = f.mount({ first: 'Alice', last: 'Smith' });
    value.value = { first: 'Alice', last: 'Updated' };
    await nextTick();
    expect((wrapper.findAll('input')[1].element as HTMLInputElement).value).toBe('Updated');
  });

  // ─── Error routing ────────────────────────────────────────────────────────
  //
  // The flat MessageBag is sliced per child field name (via sliceMessageBag).
  // Each error must reach exactly the right field — not any other field.

  test('errors for a field name appear on the correct input', async () => {
    const { errors, wrapper } = f.mount({ first: 'Alice', last: 'Smith' });
    errors.value = { 'first': ['Required'] };
    await nextTick();
    const inputs = wrapper.findAll('input');
    expect(inputs[0].classes()).toContain('is-invalid');
    expect(inputs[1].classes()).not.toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Required');
  });

  test('errors on one field do not mark other fields invalid', async () => {
    const { errors, wrapper } = f.mount({ first: 'Alice', last: 'Smith' });
    errors.value = { 'last': ['Too long'] };
    await nextTick();
    const inputs = wrapper.findAll('input');
    expect(inputs[1].classes()).toContain('is-invalid');
    expect(inputs[0].classes()).not.toContain('is-invalid');
  });

  test('clearing errors removes all is-invalid classes', async () => {
    const { errors, wrapper } = f.mount({ first: 'Alice', last: 'Smith' });
    errors.value = { 'first': ['Required'] };
    await nextTick();
    errors.value = {};
    await nextTick();
    wrapper.findAll('input').forEach(input => {
      expect(input.classes()).not.toContain('is-invalid');
    });
  });

  // ─── View mode ────────────────────────────────────────────────────────────

  test('child fields render as text (no inputs) in view mode', () => {
    const { wrapper } = f.mountInViewMode({ first: 'Alice', last: 'Smith' });
    expect(wrapper.find('input').exists()).toBe(false);
  });
});

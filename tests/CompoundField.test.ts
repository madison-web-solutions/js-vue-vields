// Shared behaviours (NamedLens value chain, error routing, view mode) are
// tested against both FieldGroup and CompoundField in compound-behaviors.test.ts.
// This file covers what is specific to CompoundField: FieldWrapper features
// (label, compound-level errors), disabled, and the name-binding mode where
// CompoundField sits inside a FieldGroup and receives its value/errors via the
// parent's NamedLens.

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import type { MessageBag } from '../src/types';
import CompoundField from '../src/components/CompoundField.vue';
import FieldGroup from '../src/components/FieldGroup.vue';
import TextField from '../src/components/TextField.vue';
import { mountCompoundField } from './compound-utils';

describe('CompoundField', () => {

  // ─── FieldWrapper features ────────────────────────────────────────────────

  test('renders a label when the label prop is provided', () => {
    const { wrapper } = mountCompoundField({}, { label: 'Full name' });
    expect(wrapper.find('label').text()).toContain('Full name');
  });

  // Errors keyed at '' in the MessageBag are "this field has an error" as opposed
  // to "a child field has an error". They should appear in CompoundField's own
  // FieldWrapper error container, not on any child field.
  test("errors at key '' appear in the compound field's own error container", async () => {
    const { errors, wrapper } = mountCompoundField({ first: 'Alice', last: 'Smith' });
    errors.value = { '': ['Object is invalid'] };
    await nextTick();
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Object is invalid');
    // Child fields must not be marked invalid
    wrapper.findAll('input').forEach(input => {
      expect(input.classes()).not.toContain('is-invalid');
    });
  });

  // ─── name binding (NamedLens from parent) ─────────────────────────────────
  //
  // CompoundField extends FieldProps and so can be used inside a FieldGroup with
  // a name prop, receiving its value and errors via the parent's injected NamedLens
  // rather than via v-model. This allows arbitrarily deep nesting of compound fields.

  test('receives values and errors via a parent FieldGroup NamedLens when name is set', async () => {
    const value = ref({ address: { street: 'Main St', city: 'Springfield' } });
    const errors = ref<MessageBag>({});
    const Parent = defineComponent({
      components: { FieldGroup, CompoundField, TextField },
      setup() { return { value, errors }; },
      template: `
        <FieldGroup v-model="value" v-model:errors="errors">
          <CompoundField name="address">
            <TextField name="street" /><TextField name="city" />
          </CompoundField>
        </FieldGroup>
      `,
    });
    const wrapper = mount(Parent);
    const inputs = wrapper.findAll('input');

    expect((inputs[0].element as HTMLInputElement).value).toBe('Main St');
    expect((inputs[1].element as HTMLInputElement).value).toBe('Springfield');

    await inputs[0].setValue('Broadway');
    expect(value.value.address.street).toBe('Broadway');

    errors.value = { 'address.street': ['Invalid street'] };
    await nextTick();
    expect(inputs[0].classes()).toContain('is-invalid');
    expect(inputs[1].classes()).not.toContain('is-invalid');
  });
});

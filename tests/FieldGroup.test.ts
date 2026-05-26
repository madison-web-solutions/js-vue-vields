// Shared behaviours (NamedLens value chain, error routing, view mode) are
// tested against both FieldGroup and CompoundField in compound-behaviors.test.ts.
// This file covers what is specific to FieldGroup: the editMode prop, which
// FieldGroup can accept directly (via useExtendsEditMode) rather than only via
// injection from a parent context.

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import type { EditMode, MessageBag } from '../src/types';
import FieldGroup from '../src/components/FieldGroup.vue';
import TextField from '../src/components/TextField.vue';

describe('FieldGroup', () => {

  // ─── editMode prop propagation ────────────────────────────────────────────
  //
  // FieldGroup uses useExtendsEditMode, which means its editMode prop takes
  // priority over any injected context value and is re-provided to all
  // descendants. This is different from CompoundField, which only reads the
  // injected editMode without re-providing or accepting an editMode prop.

  test('editMode="view" prop renders child fields as text without injection', () => {
    // No provide() in the parent — view mode comes solely from the FieldGroup prop
    const wrapper = mount(FieldGroup, {
      props: { modelValue: { first: 'Alice' }, errors: {} as MessageBag, editMode: 'view' as EditMode },
      slots: { default: '<TextField name="first" />' },
      global: { components: { TextField } },
    });
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('Alice');
  });

  test('reactively changing the editMode prop switches between edit and view', async () => {
    const editMode = ref<EditMode>('edit');
    const Parent = defineComponent({
      components: { FieldGroup, TextField },
      setup() {
        return { value: ref({ first: 'Alice' }), errors: ref<MessageBag>({}), editMode };
      },
      template: `
        <FieldGroup v-model="value" v-model:errors="errors" :editMode="editMode">
          <TextField name="first" />
        </FieldGroup>
      `,
    });
    const wrapper = mount(Parent);

    expect(wrapper.find('input').exists()).toBe(true);

    editMode.value = 'view';
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(false);

    editMode.value = 'edit';
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(true);
  });
});

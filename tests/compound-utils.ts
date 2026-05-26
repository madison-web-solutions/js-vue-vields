import { defineComponent, provide, ref } from 'vue';
import type { Ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import type { EditMode, MessageBag } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import FieldGroup from '../src/components/FieldGroup.vue';
import CompoundField from '../src/components/CompoundField.vue';
import TextField from '../src/components/TextField.vue';

export type CompoundMountResult = {
  value: Ref<Record<string, string>>;
  errors: Ref<MessageBag>;
  wrapper: VueWrapper;
};

export type CompoundFixture = {
  label: string;
  mount: (
    initialValue?: Record<string, string>,
    extraProps?: Record<string, unknown>,
    editMode?: Ref<EditMode>,
  ) => CompoundMountResult;
  mountInViewMode: (initialValue?: Record<string, string>) => CompoundMountResult;
};

// ─── FieldGroup ──────────────────────────────────────────────────────────────

export const mountFieldGroup = (
  initialValue: Record<string, string> = {},
  extraProps: Record<string, unknown> = {},
  editMode?: Ref<EditMode>,
): CompoundMountResult => {
  const value = ref<Record<string, string>>({ ...initialValue });
  const errors = ref<MessageBag>({});
  const Parent = defineComponent({
    components: { FieldGroup, TextField },
    setup() {
      if (editMode) provide(injectionSymbols.editMode, editMode);
      return { value, errors, extraProps };
    },
    template: `
      <FieldGroup v-model="value" v-model:errors="errors" v-bind="extraProps">
        <TextField name="first" /><TextField name="last" />
      </FieldGroup>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

// ─── CompoundField ───────────────────────────────────────────────────────────

export const mountCompoundField = (
  initialValue: Record<string, string> = {},
  extraProps: Record<string, unknown> = {},
  editMode?: Ref<EditMode>,
): CompoundMountResult => {
  const value = ref<Record<string, string>>({ ...initialValue });
  const errors = ref<MessageBag>({});
  const Parent = defineComponent({
    components: { CompoundField, TextField },
    setup() {
      if (editMode) provide(injectionSymbols.editMode, editMode);
      return { value, errors, extraProps };
    },
    template: `
      <CompoundField v-model="value" v-model:errors="errors" v-bind="extraProps">
        <TextField name="first" /><TextField name="last" />
      </CompoundField>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const viewMode = ref<EditMode>('view');

const fieldGroupFixture: CompoundFixture = {
  label: 'FieldGroup',
  mount: mountFieldGroup,
  mountInViewMode: (initialValue) => mountFieldGroup(initialValue, {}, viewMode),
};

const compoundFieldFixture: CompoundFixture = {
  label: 'CompoundField',
  mount: mountCompoundField,
  mountInViewMode: (initialValue) => mountCompoundField(initialValue, {}, viewMode),
};

export const fixtures: CompoundFixture[] = [fieldGroupFixture, compoundFieldFixture];

import { defineComponent, provide, ref } from 'vue';
import type { Ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import type { EditMode, MessageBag } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import RepeaterField from '../src/components/RepeaterField.vue';
import RepeaterTableField from '../src/components/RepeaterTableField.vue';
import TextField from '../src/components/TextField.vue';

export type MountResult = {
  value: Ref<unknown[]>;
  errors: Ref<MessageBag>;
  wrapper: VueWrapper;
};

export type RepeaterFixture = {
  label: string;
  makeRows: (n: number) => unknown[];
  getRowLabel: (row: unknown) => string;
  mount: (rows?: unknown[], extraProps?: Record<string, unknown>, editMode?: Ref<EditMode>) => MountResult;
  mountInViewMode: (rows?: unknown[]) => MountResult;
  rowSel: string;
  appendSel: string;
  moveTargetSel: string;
  moveAfterSel: string;
};

// ─── Simple repeater ────────────────────────────────────────────────────────

export const mountSimpleRepeater = (
  rows: unknown[] = [],
  extraProps: Record<string, unknown> = {},
  editMode?: Ref<EditMode>,
): MountResult => {
  const value = ref<unknown[]>([...rows]);
  const errors = ref<MessageBag>({});
  const Parent = defineComponent({
    components: { RepeaterField, TextField },
    setup() {
      if (editMode) provide(injectionSymbols.editMode, editMode);
      return { value, errors, extraProps };
    },
    template: `
      <RepeaterField v-model="value" v-model:errors="errors" subValuesType="simple" v-bind="extraProps">
        <template #default><TextField /></template>
      </RepeaterField>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

// ─── Compound repeater ──────────────────────────────────────────────────────

export const mountCompoundRepeater = (
  rows: unknown[] = [],
  extraProps: Record<string, unknown> = {},
  editMode?: Ref<EditMode>,
): MountResult => {
  const value = ref<unknown[]>([...rows]);
  const errors = ref<MessageBag>({});
  const Parent = defineComponent({
    components: { RepeaterField, TextField },
    setup() {
      if (editMode) provide(injectionSymbols.editMode, editMode);
      return { value, errors, extraProps };
    },
    template: `
      <RepeaterField v-model="value" v-model:errors="errors" v-bind="extraProps">
        <template #default>
          <TextField name="first" /><TextField name="last" />
        </template>
      </RepeaterField>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

// ─── Table repeater ─────────────────────────────────────────────────────────

const tableCols = [
  { name: 'first', label: 'First' },
  { name: 'last', label: 'Last' },
];

export const mountTableRepeater = (
  rows: unknown[] = [],
  extraProps: Record<string, unknown> = {},
  editMode?: Ref<EditMode>,
): MountResult => {
  const value = ref<unknown[]>([...rows]);
  const errors = ref<MessageBag>({});
  const Parent = defineComponent({
    components: { RepeaterTableField, TextField },
    setup() {
      if (editMode) provide(injectionSymbols.editMode, editMode);
      return { value, errors, cols: tableCols, extraProps };
    },
    template: `
      <RepeaterTableField v-model="value" v-model:errors="errors" :cols="cols" v-bind="extraProps">
        <template #first><TextField name="first" /></template>
        <template #last><TextField name="last" /></template>
      </RepeaterTableField>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

// ─── Row factories ──────────────────────────────────────────────────────────

// Simple rows are plain strings; compound/table rows are {first, last} objects.
// makeRows always produces rows with 'a', 'b', 'c', 'd' as their identifying values,
// so getRowLabel(row) always returns a single letter regardless of variant.

const simpleRows = ['a', 'b', 'c', 'd'];
const compoundRows = [
  { first: 'a', last: 'aa' },
  { first: 'b', last: 'bb' },
  { first: 'c', last: 'cc' },
  { first: 'd', last: 'dd' },
];

const viewMode = ref<EditMode>('view');

// ─── Fixture objects ─────────────────────────────────────────────────────────

const simpleFixture: RepeaterFixture = {
  label: 'Simple repeater',
  makeRows: (n) => simpleRows.slice(0, n),
  getRowLabel: (row) => row as string,
  mount: mountSimpleRepeater,
  mountInViewMode: (rows) => mountSimpleRepeater(rows, {}, viewMode),
  rowSel: '.vfm-repeater-item',
  appendSel: '.vfm-repeater-append button',
  moveTargetSel: '.vfm-repeater-move-target',
  moveAfterSel: '.vfm-move-after',
};

const compoundFixture: RepeaterFixture = {
  label: 'Compound repeater',
  makeRows: (n) => compoundRows.slice(0, n),
  getRowLabel: (row) => (row as { first: string }).first,
  mount: mountCompoundRepeater,
  mountInViewMode: (rows) => mountCompoundRepeater(rows, {}, viewMode),
  rowSel: '.vfm-repeater-item',
  appendSel: '.vfm-repeater-append button',
  moveTargetSel: '.vfm-repeater-move-target',
  moveAfterSel: '.vfm-move-after',
};

const tableFixture: RepeaterFixture = {
  label: 'Table repeater',
  makeRows: (n) => compoundRows.slice(0, n),
  getRowLabel: (row) => (row as { first: string }).first,
  mount: mountTableRepeater,
  mountInViewMode: (rows) => mountTableRepeater(rows, {}, viewMode),
  rowSel: '.vfm-repeater-table-item',
  appendSel: '.vfm-repeater-table-append button',
  moveTargetSel: '.vfm-repeater-table-move-target',
  moveAfterSel: '.move-after',
};

export const fixtures: RepeaterFixture[] = [simpleFixture, compoundFixture, tableFixture];

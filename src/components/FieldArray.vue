<template>
  <slot
    name="beforeLoop"
    :field="field"
    :canAddRow="canAddRow"
    :appendRow="appendRow"
    :insertRowAt="insertRowAt"
    :deleteRowAt="deleteRowAt"
  ></slot>
  <slot :loopItems="loopItems"></slot>
  <slot
    name="afterLoop"
    :field="field"
    :canAddRow="canAddRow"
    :appendRow="appendRow"
    :insertRowAt="insertRowAt"
    :deleteRowAt="deleteRowAt"
  ></slot>
</template>

<script setup lang="ts">
import type { MessageBag, RepeaterFormValue, EditMode, Config, RepeaterItem, FieldProps, RepeaterFieldProps, Loose, FieldState} from "../types";
import { toRefs } from "vue";
import useRepeaterField from "../lib/useRepeaterField";
import useExtendsConfig from "../lib/useExtendsConfig";
import useExtendsEditMode from "../lib/useExtendsEditMode";

const props = defineProps<FieldProps & RepeaterFieldProps & {
  config?: Loose<Config>;
  editMode?: EditMode;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: RepeaterFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const slots = defineSlots<{
  default: (props: { loopItems: RepeaterItem[] }) => any;
  beforeLoop: (props: {
    field: FieldState<RepeaterFormValue>;
    canAddRow: boolean;
    appendRow: () => void;
    insertRowAt: (index: number) => void;
    deleteRowAt: (index: number) => void;
  }) => any;
  afterLoop: (props: {
    field: FieldState<RepeaterFormValue>;
    canAddRow: boolean;
    appendRow: () => void;
    insertRowAt: (index: number) => void;
    deleteRowAt: (index: number) => void;
  }) => any;
}>();

const propRefs = toRefs(props);

useExtendsConfig(propRefs.config);
useExtendsEditMode(propRefs.editMode);

const { field, canAddRow, appendRow, insertRowAt, deleteRowAt, loopItems } = useRepeaterField(emit, propRefs);
</script>

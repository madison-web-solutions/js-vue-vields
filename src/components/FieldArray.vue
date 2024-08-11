<template>
  <slot
    name="beforeLoop"
    :canAddRow="canAddRow"
    :appendRow="appendRow"
    :insertRowAt="insertRowAt"
    :deleteRowAt="deleteRowAt"
  ></slot>
  <slot :loopItems="loopItems"></slot>
  <slot
    name="afterLoop"
    :canAddRow="canAddRow"
    :appendRow="appendRow"
    :insertRowAt="insertRowAt"
    :deleteRowAt="deleteRowAt"
  ></slot>
</template>

<script setup lang="ts">
import type {
  MessageBag,
  RepeaterFormValue,
  EditMode,
  Config,
  RepeaterItem,
} from "../main";
import { toRefs } from "vue";
import {
  useRepeaterField,
  useExtendsEditMode,
  useExtendsConfig,
} from "../main";

const props = defineProps<{
  modelValue?: any;
  errors?: MessageBag;
  name?: string;
  index?: number;
  min?: number;
  max?: number;
  editMode?: EditMode;
  config?: Partial<Config>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: RepeaterFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const slots = defineSlots<{
  default: (props: { loopItems: RepeaterItem[] }) => any;
  beforeLoop: (props: {
    canAddRow: boolean;
    appendRow: () => void;
    insertRowAt: (index: number) => void;
    deleteRowAt: (index: number) => void;
  }) => any;
  afterLoop: (props: {
    canAddRow: boolean;
    appendRow: () => void;
    insertRowAt: (index: number) => void;
    deleteRowAt: (index: number) => void;
  }) => any;
}>();

const propRefs = toRefs(props);

const { canAddRow, appendRow, insertRowAt, deleteRowAt, loopItems } =
  useRepeaterField(emit, propRefs);

useExtendsEditMode(propRefs.editMode);
useExtendsConfig(propRefs.config);
</script>

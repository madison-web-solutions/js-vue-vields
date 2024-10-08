<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <textarea
        :id="inputEleId"
        :name="pathString"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': hasError }"
        :rows="rows"
        :disabled="disabled"
        :placeholder="placeholder"
        v-model="modelValue"
      ></textarea>
      <span
        v-if="showRemainingChars"
        class="position-absolute bottom-0 end-0 p-1 small text-muted"
        >{{ remainingChars }}</span
      >
    </template>
    <template #viewMode>{{ modelValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from "../main";
import { toRefs } from "vue";
import {
  commonProps,
  useFormField,
  useHasMaxChars,
  getConfigRef,
} from "../main";

const props = defineProps(
  Object.assign({}, commonProps, {
    rows: {
      type: Number,
      required: false,
    },
    max: {
      type: Number,
      required: false,
    },
  }),
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const rows = getConfigRef("textArea.numRows", propRefs.rows);

const coerceToString = (value: any): string => {
  return value ? String(value) : "";
};

const {
  inputEleId,
  pathString,
  modelValue,
  hasError,
  FieldWrapper,
  standardWrapperProps,
  focus,
} = useFormField<string>(coerceToString, emit, propRefs, {
  fieldTypeSlug: "text-area",
});

const { remainingChars, showRemainingChars } = useHasMaxChars(
  modelValue,
  propRefs,
);

defineExpose({ focus });
</script>

<template>
  <FieldWrapper :field="field">
    <template #input>
      <input
        :id="field.inputEleId"
        :type="inputType ?? 'text'"
        :name="field.pathString"
        class="form-control"
        :class="{ 'is-invalid': field.hasError }"
        :disabled="field.disabled"
        :placeholder="field.placeholder"
        :maxlength="max"
        v-model="modelValue"
        @keydown.enter="emit('enterPress')"
      />
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
import type { FieldProps, HasMaxCharsFieldProps, MessageBag } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasMaxChars from "../lib/useHasMaxChars";
import { coerceToString } from "../lib/type-utils";

const props = defineProps<FieldProps & HasMaxCharsFieldProps & {
  inputType?: string,
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:errors", value: MessageBag): void;
  (e: "enterPress"): void;
}>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper } = useFormField<string>(coerceToString, emit, propRefs);
const { remainingChars, showRemainingChars } = useHasMaxChars(modelValue, propRefs);

</script>

<template>
  <FieldWrapper :field="field">
    <template #input>
      <textarea
        :id="field.inputEleId"
        :name="field.pathString"
        class="form-control"
        :class="{ 'is-invalid': field.hasError }"
        :rows="rows"
        :disabled="field.disabled"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
        :maxlength="max"
        v-model="modelValue"
      ></textarea>
      <span v-if="showRemainingChars" class="position-absolute bottom-0 end-0 p-1 small text-muted">{{ remainingChars }}</span>
    </template>
    <template #viewMode>{{ modelValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps, HasMaxCharsFieldProps } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasMaxChars from "../lib/useHasMaxChars";
import { coerceToString } from "../lib/type-utils";
import { getConfigRef } from "../lib/config";

const props = defineProps<FieldProps & HasMaxCharsFieldProps & {
  rows?: number | undefined,
}>();

const emit = defineEmits<FieldEmitType<string>>();

const propRefs = toRefs(props);

const rows = getConfigRef('textArea.numRows', propRefs.rows);

const { modelValue, field, FieldWrapper, focus } = useFormField<string>(coerceToString, emit, propRefs);
const { remainingChars, showRemainingChars } = useHasMaxChars(modelValue, propRefs);

defineExpose({ focus });

</script>

<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          :id="field.inputEleId"
          :name="field.pathString"
          v-model="modelValue"
          :class="{ 'is-invalid': field.hasError }"
          :disabled="field.disabled"
        />
        <label class="form-check-label" :for="field.inputEleId">{{ displayValue }}</label>
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps } from "../types";
import { computed, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import { coerceToBoolean } from "../lib/type-utils";

const props = defineProps<FieldProps & {
  trueLabel?: string,
  falseLabel?: string,
}>();

const emit = defineEmits<FieldEmitType<boolean | null>>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper, focus } = useFormField<boolean | null>(coerceToBoolean, emit, propRefs);

const displayValue = computed((): string => {
  if (modelValue.value === true) {
    return props.trueLabel ?? "On";
  }
  if (modelValue.value === false) {
    return props.falseLabel ?? "Off";
  }
  return "";
});

defineExpose({ focus });

</script>

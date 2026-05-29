<template>
  <FieldWrapper :field="{ ...field, label: inlineLabel ? undefined : label}">
    <template #input>
      <div :class="{'form-check': true, 'vfm-checked': modelValue === true}">
        <input
          class="form-check-input"
          type="checkbox"
          :id="field.inputEleId"
          :name="field.pathString"
          v-model="modelValue"
          :class="{ 'is-invalid': field.hasError }"
          :disabled="field.disabled"
        />
        <label v-if="label && inlineLabel" class="form-check-label" :for="field.inputEleId">{{ label }}</label>
      </div>
    </template>
    <template #viewMode>
      <template v-if="inlineLabel">{{ label }}: </template>{{ displayValue }}
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps } from "../types";
import { computed, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import { coerceToBoolean } from "../lib/type-utils";

const props = defineProps<FieldProps & {
  inlineLabel?: boolean | undefined,
  trueLabel?: string | undefined,
  falseLabel?: string | undefined,
}>();

const trueLabel = computed(() => props.trueLabel ?? 'Yes');
const falseLabel = computed(() => props.falseLabel ?? 'No');

const emit = defineEmits<FieldEmitType<boolean>>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): boolean => {
  return coerceToBoolean(value) === true;
};

const { modelValue, field, FieldWrapper } = useFormField<boolean>(coerceFn, emit, propRefs);

const displayValue = computed((): string => {
  if (modelValue.value === true) {
    return trueLabel.value;
  } else {
    return falseLabel.value;
  }
});

</script>

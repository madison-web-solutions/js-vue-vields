<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <input
        :id="inputEleId"
        :name="pathString"
        type="password"
        class="form-control"
        :class="{ 'is-invalid': hasError }"
        :disabled="disabled"
        :placeholder="placeholder"
        v-model="modelValue"
      />
      <PasswordStrengthMeter
        v-if="minStrength != null"
        class="mt-2"
        :password="modelValue"
        :okStrength="minStrength"
      />
    </template>
    <template #viewMode>********</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from "../main";
import { toRefs } from "vue";
import { commonProps, useFormField, PasswordStrengthMeter } from "../main";

const props = defineProps(
  Object.assign({}, commonProps, {
    inputType: {
      type: String,
      default: "text",
    },
    minStrength: {
      type: Number,
    },
  }),
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

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
  fieldTypeSlug: "password",
});

defineExpose({ focus });
</script>

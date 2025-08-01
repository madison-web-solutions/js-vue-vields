<template>
  <FieldWrapper :field="field">
    <template #input>
      <input
        :id="field.inputEleId"
        :name="field.pathString"
        type="password"
        class="form-control"
        :class="{ 'is-invalid': field.hasError }"
        :disabled="field.disabled"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
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
import type { MessageBag, FieldProps } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import PasswordStrengthMeter from "./PasswordStrengthMeter.vue";
import { coerceToString } from "../lib/type-utils";

const props = defineProps<FieldProps & {
  minStrength?: number | undefined
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper } = useFormField<string>(coerceToString, emit, propRefs);
</script>

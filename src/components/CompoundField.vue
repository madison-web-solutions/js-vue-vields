<template>
  <FieldWrapper :field="field">
    <template #input>
      <slot :subVals="modelValue"></slot>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, CompoundFormValue, FieldProps, Loose, Config } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasCompoundValue from "../lib/useHasCompoundValue";
import useExtendsConfig from "../lib/useExtendsConfig";
import { coerceToCompoundFormValue } from "../lib/type-utils";

const props = defineProps<FieldProps & {
    config?: Loose<Config>
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: CompoundFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const slots = defineSlots<{
  default: (props: { subVals: CompoundFormValue }) => any;
}>();

const propRefs = toRefs(props);

useExtendsConfig(propRefs.config);
const { modelValue, errors, field } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);
useHasCompoundValue(modelValue, errors);
</script>

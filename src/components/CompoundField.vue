<template>
  <FieldWrapper :field="field">
    <template #input>
      <slot :subVals="modelValue"></slot>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, CompoundFormValue, FieldProps, Loose, Config } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import { provideFormValues } from "../lib/context";
import useExtendsConfig from "../lib/useExtendsConfig";
import { coerceToCompoundFormValue } from "../lib/type-utils";

const props = defineProps<FieldProps & {
    config?: Loose<Config>
}>();

const emit = defineEmits<FieldEmitType<CompoundFormValue>>();

const slots = defineSlots<{
  default: (props: { subVals: CompoundFormValue }) => any;
}>();

const propRefs = toRefs(props);

useExtendsConfig(propRefs.config);
const { modelValue, errors, field, FieldWrapper } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);
provideFormValues(modelValue, errors);
</script>

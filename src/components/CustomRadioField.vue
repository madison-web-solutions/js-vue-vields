<template>
  <FieldWrapper :field="field">
    <template #input>
      <div v-for="choice in choicesNormalized" @click="selectOption(choice)">
        <slot :choice="choice" :selected="modelValue === choice.key">{{ choice.label }}</slot>
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { Choosable, FieldProps, HasChoicesFieldProps, MessageBag } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasChoicesSingle from "../lib/useHasChoicesSingle";

type IdType = string | number | null;

const props = defineProps<FieldProps & HasChoicesFieldProps & {
  inline?: boolean,
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: IdType): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const slots = defineSlots<{
  default: (props: { choice: Choosable, selected: boolean }) => any;
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): IdType => {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
      return value;
  }
  return null;
};

const { modelValue, field, FieldWrapper } = useFormField<IdType>(coerceFn, emit, propRefs);
const { choicesNormalized, displayValue } = useHasChoicesSingle(modelValue, propRefs);

const selectOption = (choice: Choosable) => {
  if (field.value.disabled) {
    return;
  }
  modelValue.value = choice.key;
};

</script>

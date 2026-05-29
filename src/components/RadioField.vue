<template>
  <FieldWrapper :field="field">
    <template #input>
      <div v-for="choice in choicesNormalized" :class="{ 'form-check': true, 'form-check-inline': inline, 'vfm-checked': modelValue === choice.key }">
        <input
          class="form-check-input"
          :class="{ 'is-invalid': field.hasError }"
          type="radio"
          :id="field.inputEleId + String(choice.key)"
          :name="field.pathString"
          :checked="modelValue === choice.key"
          :disabled="field.disabled"
          @change="change(choice)"
        />
        <label class="form-check-label" :for="field.inputEleId + String(choice.key)">
          <slot :choice="choice" :selected="modelValue === choice.key">{{ choice.label }}</slot>
        </label>
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, Choosable, FieldProps, HasChoicesFieldProps } from "../types";
import { toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasChoicesSingle from "../lib/useHasChoicesSingle";

type IdType = string | number | null;

const props = defineProps<FieldProps & HasChoicesFieldProps & {
  inline?: boolean,
}>();

const emit = defineEmits<FieldEmitType<IdType>>();

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
const { choicesNormalized, currentChoice, displayValue } = useHasChoicesSingle(modelValue, propRefs);

const change = (newChoice: Choosable) => {
  if (props.disabled) {
    return;
  }
  modelValue.value = newChoice.key;
};

</script>

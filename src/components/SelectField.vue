<template>
  <FieldWrapper :field="field">
    <template #input>
      <select
        class="form-select"
        :class="{ 'is-invalid': field.hasError }"
        :id="field.inputEleId"
        :name="field.pathString"
        :disabled="field.disabled"
        :autocomplete="field.autocomplete"
        @change="change"
      >
        <option ref="nullOption" :disabled="field.required" :selected="nullSelected">{{ nullOptionLabel }}</option>
        <option v-for="choice in choicesNormalized" :selected="modelValue === choice.key">{{ choice.label }}</option>
      </select>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps, HasChoicesFieldProps } from "../types";
import { computed, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasChoicesSingle from "../lib/useHasChoicesSingle";

type IdType = string | number | null;

const props = defineProps<FieldProps & HasChoicesFieldProps>();

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

const { modelValue, field, FieldWrapper, focus } = useFormField<IdType>(coerceFn, emit, propRefs);

const { choicesNormalized, nullSelected, displayValue } = useHasChoicesSingle(modelValue, propRefs);

const nullOptionLabel = computed(() => {
  return props.placeholder || (props.required ? "Select" : "");
});

const change = (e: Event) => {
  if (props.disabled) {
    return;
  }
  const target = e.target as HTMLSelectElement;
  var index = target.selectedIndex;
  if (index === 0) {
    modelValue.value = null;
  } else {
    modelValue.value = choicesNormalized.value[index - 1].key;
  }
};

defineExpose({ focus });

</script>

<template>
  <RepeaterField
    :modelValue="modelValue"
    :errors="errors"
    :label="label"
    :required="required"
    :disabled="disabled"
    :help="help"
    :placeholder="placeholder"
    :name="name"
    appendLabel="Add Section"
    @update:model-value="(newValue) => emit('update:modelValue', newValue)"
    @update:errors="(newErrors) => emit('update:errors', newErrors)"
  >
    <template v-slot="{ index, subVals }">
      <SelectField
        label="Content Type"
        name="content_type"
        :choices="sectionChoices"
        :required="true"
        class="mb-3"
      />
      <template
        v-if="
          subVals != null &&
          typeof subVals == 'object' &&
          'content_type' in subVals &&
          typeof subVals.content_type == 'string' &&
          isValidSection(subVals.content_type)
        "
      >
        <slot
          :name="subVals.content_type"
          :index="index"
          :subVals="subVals"
        ></slot>
      </template>
    </template>
  </RepeaterField>
</template>

<script setup lang="ts">
import type { FieldProps, MessageBag, Choosable, RepeaterFormValue, FormValue } from "../types";
import RepeaterField from "./RepeaterField.vue";
import SelectField from "./SelectField.vue";

const props = defineProps<FieldProps & {
  sectionChoices: Choosable[],
}>();

const slots = defineSlots<Record<string, (props: {index: number; subVals: FormValue}) => any>>();

const emit = defineEmits<{
  (e: "update:modelValue", value: RepeaterFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const isValidSection = (value: string): boolean => {
  for (const choice of props.sectionChoices) {
    if (choice.key === value) {
      return true;
    }
  }
  return false;
};
</script>

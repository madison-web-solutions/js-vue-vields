<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="vfm-custom-select" ref="container">
        <div class="form-select" @click="toggleDropdown">
          <slot v-if="currentChoice" :choice="currentChoice">{{currentChoice.label}}</slot>
          <slot v-if="nullSelected" name="nullSelected">{{placeholder || nbsp}}</slot>
        </div>
        <div v-if="showDropdown" class="vfm-custom-select-items">
          <div v-if="nullSelected || !required" class="vfm-custom-select-item'" @click="selectNull()">
            <slot name="nullOption"><span class="text-muted">{{ noValueLabel }}</span></slot>
          </div>
          <div v-for="choice in choicesNormalized" class="vfm-custom-select-item" @click="selectOption(choice)">
            <slot :choice="choice">{{ choice.label }}</slot>
          </div>
        </div>
      </div>
    </template>
    <template #viewMode>
      <template>{{ displayValue }}</template>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, Choosable, FieldProps, HasChoicesFieldProps } from "../types";
import { onMounted, onBeforeUnmount, ref, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasChoicesSingle from "../lib/useHasChoicesSingle";
import { getConfigRef } from "../lib/config";

type IdType = string | number | null;

const nbsp = "\xa0";

const props = defineProps<FieldProps & HasChoicesFieldProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: IdType): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const slots = defineSlots<{
  default: (props: { choice: Choosable }) => any;
  nullSelected: (props: {}) => any;
  nullOption: (props: {}) => any;
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

const { choicesNormalized, currentChoice, nullSelected, displayValue } = useHasChoicesSingle(modelValue, propRefs);

const showDropdown = ref(false);

const openDropdown = () => {
  if (field.value.disabled) {
    return;
  }
  showDropdown.value = true;
};

const closeDropdown = () => {
  showDropdown.value = false;
};

const toggleDropdown = () => {
  showDropdown.value ? closeDropdown() : openDropdown();
};

// Close the dropdown if the user has clicked on the page outside of it
const container = ref<HTMLElement | null>(null);
const maybeCloseDropdown = (e: MouseEvent) => {
  if (showDropdown.value) {
    const target = e.target as Element;
    if (
      document.body.contains(target) &&
      container.value != null &&
      container.value !== target &&
      !container.value.contains(target)
    ) {
      closeDropdown();
    }
  }
};
onMounted(() => document.addEventListener("click", maybeCloseDropdown));
onBeforeUnmount(() =>
  document.removeEventListener("click", maybeCloseDropdown),
);

const selectNull = () => {
  if (field.value.disabled) {
    return;
  }
  modelValue.value = null;
  closeDropdown();
};

const selectOption = (choice: Choosable) => {
  if (field.value.disabled) {
    return;
  }
  modelValue.value = choice.key;
  closeDropdown();
};

const noValueLabel = getConfigRef('noValueLabel');

</script>

<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="vfm-custom-select" :data-vfm-disabled="field.disabled ? '' : undefined" ref="container">
        <div class="form-select" :class="{ 'is-invalid': field.hasError }" @click="toggleDropdown">
          <slot v-if="currentChoice" :choice="currentChoice">{{currentChoice.label}}</slot>
          <slot v-if="nullSelected" name="nullSelected">{{placeholder || nbsp}}</slot>
        </div>
        <div
          v-if="showDropdown"
          class="vfm-custom-select-items"
          :class="{ 'vfm-drop-up': dropUp }"
          :style="{ maxHeight: maxHeight ?? undefined }"
        >
          <div v-if="nullSelected || !required" class="vfm-custom-select-null-item" @click="selectNull()">
            <slot name="nullOption"><span class="text-muted">{{ noValueLabel }}</span></slot>
          </div>
          <div v-for="choice in choicesNormalized" class="vfm-custom-select-item" @click="selectOption(choice)">
            <slot :choice="choice">{{ choice.label }}</slot>
          </div>
        </div>
      </div>
    </template>
    <template #viewMode>
      <slot name="viewMode" :choice="currentChoice">{{ displayValue }}</slot>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, Choosable, FieldProps, HasChoicesFieldProps } from "../types";
import { onMounted, onBeforeUnmount, ref, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasChoicesSingle from "../lib/useHasChoicesSingle";
import { getConfigRef } from "../lib/config";

type IdType = string | number | null;

const nbsp = "\xa0";

const props = defineProps<FieldProps & HasChoicesFieldProps>();

const emit = defineEmits<FieldEmitType<IdType>>();

const slots = defineSlots<{
  default: (props: { choice: Choosable }) => any;
  nullSelected: (props: {}) => any;
  nullOption: (props: {}) => any;
  viewMode: (props: { choice: Choosable|null }) => any;
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
const dropUp = ref(false);
const maxHeight = ref<string | null>(null);

const container = ref<HTMLElement | null>(null);

// Desired dropdown height before viewport-based clamping (matches .vfm-search-field-results).
const DESIRED_HEIGHT_PX = 256;
// Small gap so the dropdown does not touch the viewport edge.
const VIEWPORT_GUTTER_PX = 8;

const measurePlacement = () => {
  if (container.value == null) {
    return;
  }
  const rect = container.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const preferDown = spaceBelow >= DESIRED_HEIGHT_PX || spaceBelow >= spaceAbove;
  dropUp.value = !preferDown;
  const available = preferDown ? spaceBelow : spaceAbove;
  const clamped = Math.max(0, Math.min(DESIRED_HEIGHT_PX, available - VIEWPORT_GUTTER_PX));
  maxHeight.value = `${clamped}px`;
};

const onViewportChange = () => measurePlacement();

const openDropdown = () => {
  if (field.value.disabled) {
    return;
  }
  showDropdown.value = true;
  measurePlacement();
  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange);
};

const closeDropdown = () => {
  showDropdown.value = false;
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange);
};

const toggleDropdown = () => {
  showDropdown.value ? closeDropdown() : openDropdown();
};

// Close the dropdown if the user has clicked on the page outside of it
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
onBeforeUnmount(() => {
  document.removeEventListener("click", maybeCloseDropdown);
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange);
});

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

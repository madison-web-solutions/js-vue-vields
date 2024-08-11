<template>
  <div :data-field-type="fieldTypeSlug">
    <slot name="label">
      <label v-if="label" :for="inputEleId" class="form-label"
        >{{ label }}
        <span v-if="required">*</span>
        <i
          v-if="tooltip"
          ref="helpIconEle"
          class="help-icon fas fa-question-circle"
          @mouseenter="showTooltip"
          @mouseleave="hideTooltip"
          @click="toggleToolTip"
        ></i>
      </label>
    </slot>
    <slot name="preinput"></slot>
    <div v-if="editMode == 'edit'" :class="inputWrapperCssClass">
      <slot name="input"></slot>
    </div>
    <slot v-if="editMode == 'edit'" name="errors">
      <div v-if="hasError" class="invalid-feedback d-block">
        <div class="error" v-for="msg in errors">{{ msg }}</div>
      </div>
    </slot>
    <div v-if="editMode == 'view'">
      <slot v-if="!hasNoValue" name="viewMode">
        <slot name="input"></slot>
      </slot>
      <slot v-if="hasNoValue" name="viewModeNoValue">
        <span class="text-muted">{{ noValueLabel }}</span>
      </slot>
    </div>
    <small v-if="help" class="form-text text-muted">{{ help }}</small>
    <div
      v-if="tooltip"
      ref="tooltipEle"
      v-pclass="'tooltip'"
      :class="{ active: tooltipOpen }"
      :style="{ display: tooltipOpen ? 'inline-block' : 'none' }"
    >
      {{ tooltip }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditMode, Path } from "../main";
import { computed, inject, ref, toRefs } from "vue";
import { symbols } from "../main";
import usePopperTooltip from "../lib/usePopperTooltip";

const props = withDefaults(
  defineProps<{
    inputEleId?: string;
    label?: string;
    required: boolean;
    help?: string;
    tooltip?: string;
    modelValue?: any;
    errors?: string[];
    fieldTypeSlug?: string;
    path?: Path;
    editMode?: EditMode;
    inputWrapperCssClass?: string | string[] | object;
  }>(),
  {
    required: false,
    inputWrapperCssClass: "position-relative",
    editMode: "edit",
  },
);

const slots = defineSlots<{
  label: (props: {}) => any;
  preinput: (props: {}) => any;
  input: (props: {}) => any;
  viewMode: (props: {}) => any;
  viewModeNoValue: (props: {}) => any;
  errors: (props: {}) => any;
}>();

const hasNoValue = computed(() => {
  return (
    props.modelValue == null ||
    props.modelValue === "" ||
    (Array.isArray(props.modelValue) && props.modelValue.length == 0)
  );
});
const noValueLabel = inject(symbols.noValueLabel, ref("(None)"));

const { errors } = toRefs(props);

const hasError = computed(() => {
  return errors != null && errors.value != null && errors.value.length > 0;
});

const helpIconEle = ref<HTMLElement | null>(null);
const tooltipEle = ref<HTMLElement | null>(null);
const { tooltipOpen, showTooltip, hideTooltip, toggleToolTip } =
  usePopperTooltip(helpIconEle, tooltipEle);
</script>

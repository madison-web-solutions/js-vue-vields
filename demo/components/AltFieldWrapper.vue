<template>
  <div :data-field-type="fieldTypeSlug">
    <slot name="label">
      <label v-if="label" :for="inputEleId" class="form-label">
        <span v-if="labelSettings && labelSettings.prefix">{{
          labelSettings.prefix
        }}</span>
        {{ label }}
        <span v-if="required">*</span>
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
    <div v-if="help" class="small form-text text-muted">{{ help }}</div>
    <div v-if="path" class="small form-text text-info">
      ({{ path.join(".") }})
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Path, EditMode } from "vue-fields-ms";
import { computed, inject, ref, toRefs } from "vue";
import { symbols } from "vue-fields-ms";

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
    inputWrapperCssClass?: string | string[] | object;
    labelSettings?: { prefix?: string };
    editMode?: EditMode;
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
  return props.modelValue == null || props.modelValue === "";
});
const noValueLabel = inject(symbols.noValueLabel, ref("(None)"));

const { errors } = toRefs(props);

const hasError = computed(() => {
  return errors != null && errors.value != null && errors.value.length > 0;
});
</script>

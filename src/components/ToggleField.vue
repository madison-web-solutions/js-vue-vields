<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          :id="inputEleId"
          :name="pathString"
          v-model="modelValue"
          :class="{ 'is-invalid': hasError }"
          :disabled="disabled"
        />
        <label class="form-check-label" :for="inputEleId">{{
          displayValue
        }}</label>
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from "../main";
import { computed, toRefs } from "vue";
import { commonProps, useFormField, coerceToBoolean } from "../main";

const props = defineProps(
  Object.assign({}, commonProps, {
    trueLabel: {
      type: String,
      required: false,
    },
    falseLabel: {
      type: String,
      required: false,
    },
  }),
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean | undefined): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const {
  inputEleId,
  pathString,
  modelValue,
  hasError,
  FieldWrapper,
  standardWrapperProps,
} = useFormField<boolean | undefined>(coerceToBoolean, emit, propRefs, {
  fieldTypeSlug: "toggle",
});

const displayValue = computed((): string => {
  if (modelValue.value === true) {
    return props.trueLabel == null ? "On" : props.trueLabel;
  }
  if (modelValue.value === false) {
    return props.falseLabel == null ? "Off" : props.falseLabel;
  }
  return "";
});
</script>

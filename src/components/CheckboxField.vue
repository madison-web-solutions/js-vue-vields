<template>
  <FieldWrapper
    v-bind="standardWrapperProps"
    :label="inlineLabel ? undefined : label"
  >
    <template #input>
      <div class="form-check" v-pclass="{ checked: modelValue === true }">
        <input
          class="form-check-input"
          type="checkbox"
          :id="inputEleId"
          :name="pathString"
          v-model="modelValue"
          :class="{ 'is-invalid': hasError }"
          :disabled="disabled"
        />
        <label
          v-if="label && inlineLabel"
          class="form-check-label"
          :for="inputEleId"
          >{{ label }}</label
        >
      </div>
    </template>
    <template #viewMode
      ><template v-if="inlineLabel">{{ label }}: </template
      >{{ displayValue }}</template
    >
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from "../main";
import { computed, toRefs } from "vue";
import { commonProps, useFormField, coerceToBoolean } from "../main";

const props = defineProps(
  Object.assign({}, commonProps, {
    inlineLabel: {
      type: Boolean,
      default: false,
    },
    trueLabel: {
      type: String,
      default: "Yes",
    },
    falseLabel: {
      type: String,
      default: "No",
    },
  }),
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): boolean => {
  return coerceToBoolean(value) === true;
};

const {
  inputEleId,
  pathString,
  modelValue,
  hasError,
  FieldWrapper,
  standardWrapperProps,
  focus,
} = useFormField<boolean>(coerceFn, emit, propRefs, {
  fieldTypeSlug: "checkbox",
});

const displayValue = computed((): string => {
  if (modelValue.value === true) {
    return props.trueLabel;
  } else {
    return props.falseLabel;
  }
});

defineExpose({ focus });
</script>

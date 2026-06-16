<template>
  <FieldWrapper :field="field">
    <template #input>
      <input
        ref="inputEle"
        :id="field.inputEleId"
        :type="inputType ?? 'text'"
        :name="field.pathString"
        class="form-control"
        :class="{ 'is-invalid': field.hasError }"
        :disabled="field.disabled"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
        :maxlength="max"
        v-model="modelValue"
        @keydown.enter="emit('enterPress')"
      />
      <span
        v-if="showRemainingChars"
        class="position-absolute bottom-0 end-0 p-1 small text-muted"
        >{{ remainingChars }}</span
      >
    </template>
    <template #viewMode>{{ modelValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldProps, HasMaxCharsFieldProps, FieldEmitType, EnterPressEmitType } from "../types";
import { onBeforeUnmount, onMounted, ref, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useHasMaxChars from "../lib/useHasMaxChars";
import { getConfigRef } from "../lib/config";
import { coerceToString } from "../lib/type-utils";

const props = withDefaults(defineProps<FieldProps & HasMaxCharsFieldProps & {
  inputType?: string,
  autofillReconcile?: boolean | undefined,
}>(), {
  autofillReconcile: undefined,
});

const emit = defineEmits<FieldEmitType<string> & EnterPressEmitType>();

const propRefs = toRefs(props);

const inputEle = ref<HTMLInputElement | null>(null);

const { modelValue, field, FieldWrapper } = useFormField<string>(coerceToString, emit, propRefs);
const { remainingChars, showRemainingChars } = useHasMaxChars(modelValue, propRefs);

// Work around a Firefox autofill issue: when Firefox autofills this field on page load it writes
// the input's DOM value without firing an input or change event, so v-model never updates and the
// value is missing from the model the app submits. When enabled, copy the DOM value into the model
// once shortly after mount — but only when the model is still empty, so we never overwrite a value
// the user typed or the app loaded, and never emit when there was nothing to recover.
const autofillReconcileEnabled = getConfigRef('text.autofillReconcile', propRefs.autofillReconcile);

// Wait past the initial render so the browser has had a chance to apply any page-load autofill.
const autofillReconcileDelayMs = 100;
let reconcileTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  if (!autofillReconcileEnabled.value) {
    return;
  }
  reconcileTimer = setTimeout(() => {
    const domValue = inputEle.value?.value ?? "";
    if (domValue !== "" && modelValue.value === "") {
      modelValue.value = domValue;
    }
  }, autofillReconcileDelayMs);
});

onBeforeUnmount(() => clearTimeout(reconcileTimer));

</script>

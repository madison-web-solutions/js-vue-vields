<template>
  <FieldWrapper :field="field" :inputWrapperCssClass="inline ? 'd-flex flex-wrap' : ''">
    <template #input>
      <div
        v-for="choice in choicesNormalized"
        :key="choice.key"
        :class="inline ? 'me-3' : ''"
      >
        <div :class="{'form-check': true, 'vfm-checked': isOn(choice.key)}">
          <input
            class="form-check-input"
            type="checkbox"
            :id="field.inputEleId + choice.key"
            :name="field.pathString + '.' + choice.key"
            :checked="isOn(choice.key)"
            @change="toggle(choice.key)"
            :class="{ 'is-invalid': hasSubErrors(choice.key) }"
            :disabled="disabled"
          />
          <label class="form-check-label" :for="field.inputEleId + choice.key">{{
            choice.label
          }}</label>
        </div>
        <div v-if="hasSubErrors(choice.key)" class="invalid-feedback d-block">
          <div class="error" v-for="msg in subErrors[choice.key]">
            {{ msg }}
          </div>
        </div>
      </div>
    </template>
    <template #viewMode>
      <div v-for="choice in choicesNormalized" :key="choice.key">
        {{ choice.label }}: {{ isOn(choice.key) ? trueLabel : falseLabel }}
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, FieldProps, HasChoicesMultipleFieldProps, KeyListFormValue, BooleansMapFormValue } from "../types";
import { computed, toRefs } from "vue";
import useFormFieldWithChoicesMultiple from "../lib/useFormFieldWithChoicesMultiple";
import FieldWrapper from "./FieldWrapper.vue";

const props = defineProps<FieldProps & HasChoicesMultipleFieldProps & {
  inline?: boolean | undefined,
  trueLabel?: string | undefined,
  falseLabel?: string | undefined,
}>();

const trueLabel = computed(() => props.trueLabel ?? 'Yes');
const falseLabel = computed(() => props.falseLabel ?? 'No');

const emit = defineEmits<{
  (e: "update:modelValue", value: KeyListFormValue | BooleansMapFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const {
  field,
  choicesNormalized,
  toggle,
  isOn,
  subErrors,
  hasSubErrors,
} = useFormFieldWithChoicesMultiple(emit, propRefs);


</script>

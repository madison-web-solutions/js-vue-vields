<template>
  <FieldWrapper :field="field" >
    <template #input>
      <div class="input-group">
        <span v-if="showCurrency" class="input-group-text">{{
          currencyCode
        }}</span>
        <input
          ref="inputEle"
          :id="field.inputEleId"
          :name="field.pathString"
          type="text"
          class="form-control text-end"
          :class="{ 'is-invalid': field.hasError }"
          :disabled="field.disabled"
          :placeholder="field.placeholder"
          :autocomplete="field.autocomplete"
          :value="displayValue"
          @change="change"
          @focus="onFocus"
          @blur="onBlur"
        />
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps, ParsesTextFieldOptions } from "../types";
import { computed, ref, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import useParsesTextField from "../lib/useParsesTextField";
import { getConfigRef } from "../lib/config";

const props = withDefaults(defineProps<FieldProps & {
  currencyCode?: string | undefined,
  max?: number | undefined,
  min?: number | undefined,
  step?: number | undefined,
  showCurrency?: boolean | undefined,
}>(), {
  showCurrency: undefined,
});

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<FieldEmitType<number | null>>();

const propRefs = toRefs(props);

const showCurrency = getConfigRef("currency.showCurrency", propRefs.showCurrency);
const currencyCode = getConfigRef("currency.currencyCode", propRefs.currencyCode);

const coerceToNumber = (value: unknown): number | null => {
  switch (typeof value) {
    case "number":
      return value;
    case "string":
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
  }
  return null;
};

const { modelValue, field, FieldWrapper } = useFormField<number | null>(coerceToNumber, emit, propRefs);

const numberFormatter = computed((): Intl.NumberFormat => {
  if (currencyCode.value) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.value,
    });
  } else {
    return new Intl.NumberFormat(undefined, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
});

const exponent = computed((): number => {
  return numberFormatter.value.resolvedOptions().maximumFractionDigits ?? 2;
});

const parsesTextFieldOptions: ParsesTextFieldOptions<number> = {
  coerceNotEmpty: (textInput: string): number | undefined => {
    textInput = textInput.replace(/^[^-0-9]+/, "");
    const amountInMajorUnits = parseFloat(textInput);
    if (!isFinite(amountInMajorUnits)) {
      return undefined;
    }
    return amountInMajorUnits * Math.pow(10, exponent.value);
  },
  clamp: (amountInMinorUnits: number): number => {
    if (props.step != null) {
      amountInMinorUnits =
        Math.round(amountInMinorUnits / props.step) * props.step;
    }
    if (props.min != null) {
      amountInMinorUnits = Math.max(amountInMinorUnits, props.min);
    }
    if (props.max != null) {
      amountInMinorUnits = Math.min(amountInMinorUnits, props.max);
    }
    return Math.round(amountInMinorUnits);
  },
  formatForReading: (amountInMinorUnits: number): string => {
    const amountInMajorUnits =
      amountInMinorUnits / Math.pow(10, exponent.value);
    return numberFormatter.value.format(amountInMajorUnits);
  },
  formatForEditing: (amountInMinorUnits: number): string => {
    const amountInMajorUnits =
      amountInMinorUnits / Math.pow(10, exponent.value);
    return String(amountInMajorUnits);
  },
};

const { onFocus, onBlur, change, displayValue } = useParsesTextField<number>(modelValue, inputEle, parsesTextFieldOptions);

</script>

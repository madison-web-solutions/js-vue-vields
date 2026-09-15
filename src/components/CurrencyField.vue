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
          @keydown.enter="emit('enterPress')"
        />
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { CurrencyDenomination, FieldEmitType, EnterPressEmitType, FieldProps, ParsesTextFieldOptions } from "../types";
import { computed, ref, toRefs } from "vue";
import { coerceToNumber } from "../lib/type-utils";
import useFormField from "../lib/useFormField";
import useParsesTextField from "../lib/useParsesTextField";
import { getConfigRef } from "../lib/config";

const props = withDefaults(defineProps<FieldProps & {
  currencyCode?: string | undefined,
  max?: number | undefined,
  min?: number | undefined,
  step?: number | undefined,
  showCurrency?: boolean | undefined,
  denomination?: CurrencyDenomination | undefined,
}>(), {
  showCurrency: undefined,
});

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<FieldEmitType<number | null> & EnterPressEmitType>();

const propRefs = toRefs(props);

const showCurrency = getConfigRef("currency.showCurrency", propRefs.showCurrency);
const currencyCode = getConfigRef("currency.currencyCode", propRefs.currencyCode);
const denomination = getConfigRef("currency.denomination", propRefs.denomination);

const { modelValue, field, FieldWrapper, focus } = useFormField<number | null>(coerceToNumber, emit, propRefs);

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

// 12.5 GBP → 1250. The toFixed guard removes float artefacts before rounding:
// 1.15 * 100 === 114.99999999999999 and 1.005 * 100 === 100.49999999999999 in IEEE-754.
const majorToMinor = (amountInMajorUnits: number, exponent: number): number => {
  return Math.round(Number((amountInMajorUnits * Math.pow(10, exponent)).toFixed(6)));
};

// 1250 → 12.5. An integer divided by an exact power of ten is correctly rounded, so no
// guard is needed here (and a toFixed guard would turn String(20) into "20.00").
const minorToMajor = (amountInMinorUnits: number, exponent: number): number => {
  return amountInMinorUnits / Math.pow(10, exponent);
};

// The model value (and the min/max/step props) are either integers in minor units (the
// default) or floats in major units. All arithmetic below happens on minor-unit integers,
// so the float conversion only ever occurs once, at the boundary, via these two helpers.
const toMinor = (modelAmount: number): number => {
  return denomination.value === "major-unit" ? majorToMinor(modelAmount, exponent.value) : modelAmount;
};

const fromMinor = (amountInMinorUnits: number): number => {
  return denomination.value === "major-unit" ? minorToMajor(amountInMinorUnits, exponent.value) : amountInMinorUnits;
};

const parsesTextFieldOptions: ParsesTextFieldOptions<number> = {
  coerceNotEmpty: (textInput: string): number | undefined => {
    textInput = textInput.replace(/^[^-0-9]+/, "");
    const amountInMajorUnits = parseFloat(textInput);
    if (!isFinite(amountInMajorUnits)) {
      return undefined;
    }
    return fromMinor(majorToMinor(amountInMajorUnits, exponent.value));
  },
  clamp: (modelAmount: number): number => {
    let amountInMinorUnits = toMinor(modelAmount);
    if (props.step != null) {
      const stepInMinorUnits = toMinor(props.step);
      // A major-unit step smaller than one minor unit rounds to 0, which would divide by zero
      if (stepInMinorUnits > 0) {
        amountInMinorUnits = Math.round(amountInMinorUnits / stepInMinorUnits) * stepInMinorUnits;
      }
    }
    if (props.min != null) {
      amountInMinorUnits = Math.max(amountInMinorUnits, toMinor(props.min));
    }
    if (props.max != null) {
      amountInMinorUnits = Math.min(amountInMinorUnits, toMinor(props.max));
    }
    return fromMinor(Math.round(amountInMinorUnits));
  },
  formatForReading: (modelAmount: number): string => {
    const amountInMajorUnits = minorToMajor(toMinor(modelAmount), exponent.value);
    return numberFormatter.value.format(amountInMajorUnits);
  },
  formatForEditing: (modelAmount: number): string => {
    const amountInMajorUnits = minorToMajor(toMinor(modelAmount), exponent.value);
    return String(amountInMajorUnits);
  },
};

const { onFocus, onBlur, change, displayValue } = useParsesTextField<number>(modelValue, inputEle, parsesTextFieldOptions);

defineExpose({ focus });

</script>

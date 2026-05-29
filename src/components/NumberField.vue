<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="input-group">
        <input
          ref="inputEle"
          :id="field.inputEleId"
          :name="field.pathString"
          type="text"
          class="form-control"
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
        <span v-if="unit" class="input-group-text">{{ unit }}</span>
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, EnterPressEmitType, FieldProps, ParsesTextFieldOptions } from "../types";
import { computed, ref, toRefs } from "vue";
import { coerceToNumber } from "../lib/type-utils";
import useFormField from "../lib/useFormField";
import useParsesTextField from "../lib/useParsesTextField";

const props = defineProps<FieldProps & {
  max?: number,
  min?: number,
  integersOnly?: boolean,
  decimals?: number,
  step?: number,
  unit?: string,
  customDisplayValue?: string,
}>();

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<FieldEmitType<number | null> & EnterPressEmitType>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper } = useFormField<number | null>(coerceToNumber, emit, propRefs);

const myStep = computed((): number | undefined => {
  if (props.step == null) {
    if (props.integersOnly) {
      return 1;
    } else {
      if (props.decimals == null) {
        return undefined;
      } else {
        return Math.pow(10, -props.decimals);
      }
    }
  } else {
    return props.step;
  }
});

const localeStringOpts = computed((): Intl.NumberFormatOptions => {
  let opts: Intl.NumberFormatOptions = {};
  if (props.step == null && props.decimals != null) {
    opts.minimumFractionDigits = props.decimals;
  }
  if (props.step != null && props.step < 1) {
    opts.maximumFractionDigits = Math.log10(props.step);
  }
  return opts;
});

const parsesTextFieldOptions: ParsesTextFieldOptions<number> = {
  coerceNotEmpty: (textInput: string): number | undefined => {
    const num = parseFloat(textInput);
    return isFinite(num) ? num : undefined;
  },
  clamp: (num: number): number => {
    if (myStep.value != null) {
      num = Math.round(num / myStep.value) * myStep.value;
    }
    if (props.min != null) {
      num = Math.max(num, props.min);
    }
    if (props.max != null) {
      num = Math.min(num, props.max);
    }
    // This last step is to try and avoid float rounding errors
    // For example, if the value is 1.131 and the step size is 0.01, you might think that we'd be able to round it to 1.13 as follows:
    // Math.round((1.131) / 0.01) * 0.01
    // But that actually yields 1.1300000000000001 because of rounding errors in the float representation of 0.01
    num = (num.toFixed(12) as any) * 1;
    return num;
  },
  formatForReading: (num: number): string => {
    if (props.customDisplayValue != null) {
      return props.customDisplayValue;
    }
    return num.toLocaleString(undefined, localeStringOpts.value);
  },
  formatNullForReading: (): string => {
    if (props.customDisplayValue != null) {
      return props.customDisplayValue;
    }
    return "";
  },
  formatForEditing: (num: number): string => {
    return String(num);
  },
};

const { onFocus, onBlur, change, displayValue } = useParsesTextField<number>(modelValue, inputEle, parsesTextFieldOptions);

</script>

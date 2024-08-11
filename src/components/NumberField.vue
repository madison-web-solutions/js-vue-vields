<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <div class="input-group">
        <input
          ref="inputEle"
          :id="inputEleId"
          :name="pathString"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': hasError }"
          :disabled="disabled"
          :placeholder="placeholder"
          :value="displayValue"
          @change="change"
          @focus="onFocus"
          @blur="onBlur"
        />
        <span v-if="unit" class="input-group-text">{{ unit }}</span>
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, ParsesTextFieldOptions } from "../main";
import { computed, ref, toRefs } from "vue";
import {
  commonProps,
  coerceToNumber,
  useFormField,
  useParsesTextField,
} from "../main";

const props = defineProps(
  Object.assign({}, commonProps, {
    max: {
      type: Number,
    },
    min: {
      type: Number,
    },
    integersOnly: {
      type: Boolean,
      default: false,
    },
    decimals: {
      type: Number,
    },
    step: {
      type: Number,
    },
    unit: {
      type: String,
      required: false,
    },
    customDisplayValue: {
      type: String,
    },
  }),
);

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
  (e: "update:modelValue", value: number | undefined): void;
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
  focus,
} = useFormField<number | undefined>(coerceToNumber, emit, propRefs, {
  fieldTypeSlug: "number",
});

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

const { onFocus, onBlur, change, displayValue } = useParsesTextField<number>(
  modelValue,
  inputEle,
  parsesTextFieldOptions,
);

defineExpose({ focus });
</script>

import { computed, ref, type Ref } from "vue";
import type { ParsesTextFieldOptions } from "../types";

export default function useParsesTextField<T>(modelValue: Ref<T | undefined>, inputEle: Ref<HTMLInputElement | null>, opts: ParsesTextFieldOptions<T>) {

  const tempClear = ref<boolean>(false);

  const focused = ref<boolean>(false);

  const onFocus = () => {
    focused.value = true;
  };

  const onBlur = () => {
    focused.value = false;
  };

  const updateAfterClearing = (value: any) => {
    if (typeof setTimeout !== 'undefined') {
      tempClear.value = true;
      setTimeout(() => {
        modelValue.value = value;
        tempClear.value = false;
      }, 10);
    } else {
      modelValue.value = value;
    }
  };

  const change = () => {
    if (inputEle.value == null) {
      return;
    }
    const inputTextValue: string = (inputEle.value.value || "").replace(/\s/g, "");
    if (inputTextValue == "") {
      // No value
      updateAfterClearing(undefined);
    } else {
      const coercedValue: T | undefined = opts.coerceNotEmpty(inputTextValue);
      if (coercedValue == null) {
        updateAfterClearing(undefined);
        return;
      }
      const clampedValue: T = opts.clamp ? opts.clamp(coercedValue) : coercedValue;
      if (opts.isValid && !opts.isValid(clampedValue)) {
        updateAfterClearing(undefined);
        return;
      }
      updateAfterClearing(clampedValue);
    }
  };

  const displayValue = computed((): string => {
    if (tempClear.value) {
      return "";
    }
    if (modelValue.value == null) {
      if (!focused.value && opts.formatNullForReading) {
        return opts.formatNullForReading();
      } else {
        return "";
      }
    }
    if (focused.value && opts.formatForEditing) {
      return opts.formatForEditing(modelValue.value);
    }
    if (opts.formatForReading) {
      return opts.formatForReading(modelValue.value);
    }
    return String(modelValue.value);
  });

  return {
    focused,
    onFocus,
    onBlur,
    change,
    updateAfterClearing,
    displayValue,
  };
}

import { computed, ref, type Ref } from "vue";
import type { ParsesTextFieldOptions } from "../types";

export default function useParsesTextField<T>(modelValue: Ref<T | null>, inputEle: Ref<HTMLInputElement | null>, opts: ParsesTextFieldOptions<T>) {

  const tempClear = ref<boolean>(false);

  const focused = ref<boolean>(false);

  const onFocus = () => {
    focused.value = true;
  };

  const onBlur = () => {
    focused.value = false;
  };

  // When the clamped/parsed result equals the current modelValue, Vue detects no
  // change and skips re-evaluating displayValue, leaving the DOM input showing
  // whatever the user typed. Fix: briefly set tempClear=true (forcing displayValue
  // to "") then restore it, guaranteeing a re-evaluation regardless of whether
  // modelValue actually changed.
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
      updateAfterClearing(null);
    } else {
      const coercedValue: T | undefined = opts.coerceNotEmpty(inputTextValue);
      if (coercedValue == null) {
        updateAfterClearing(null);
        return;
      }
      const clampedValue: T = opts.clamp ? opts.clamp(coercedValue) : coercedValue;
      if (opts.isValid && !opts.isValid(clampedValue)) {
        updateAfterClearing(null);
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

import { computed, ref, type Ref } from "vue";
import type { ParsesTextFieldOptions } from "../types";

export default function useParsesTextField<T>(modelValue: Ref<T | null>, inputEle: Ref<HTMLInputElement | null>, opts: ParsesTextFieldOptions<T>) {

  const focused = ref<boolean>(false);

  const onFocus = () => {
    focused.value = true;
  };

  const onBlur = () => {
    focused.value = false;
  };

  const displayValue = computed((): string => {
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

  // Assign the canonical value, then force the input to show displayValue.
  // When the parsed result equals the current modelValue, Vue's :value diff is a
  // no-op and won't repaint the DOM, leaving the user's raw text on screen.
  // Reading displayValue here recomputes synchronously, so writing it to the input
  // guarantees the correct value regardless of whether modelValue changed.
  const commit = (value: T | null) => {
    modelValue.value = value;
    if (inputEle.value != null) {
      inputEle.value.value = displayValue.value;
    }
  };

  const change = () => {
    if (inputEle.value == null) {
      return;
    }
    const inputTextValue: string = (inputEle.value.value || "").replace(/\s/g, "");
    if (inputTextValue == "") {
      // No value
      commit(null);
    } else {
      const coercedValue: T | undefined = opts.coerceNotEmpty(inputTextValue);
      if (coercedValue == null) {
        commit(null);
        return;
      }
      const clampedValue: T = opts.clamp ? opts.clamp(coercedValue) : coercedValue;
      if (opts.isValid && !opts.isValid(clampedValue)) {
        commit(null);
        return;
      }
      commit(clampedValue);
    }
  };

  return {
    focused,
    onFocus,
    onBlur,
    change,
    displayValue,
  };
}

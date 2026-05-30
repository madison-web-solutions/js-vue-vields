import { computed } from "vue";
import { BooleansMapFormValue, FieldEmitType, FieldProps, HasChoicesMultipleFieldProps, KeyListFormValue, MessageBag, RefsOf } from "../types";
import useHasChoices from "./useHasChoices";
import { coerceToBooleansNativeMap, coerceToKeyListFormValue } from "./type-utils";
import useFormField from "./useFormField";
import { reindexErrors } from "./message-bag";

export default function useFormFieldWithChoicesMultiple(
  emit: FieldEmitType<KeyListFormValue | BooleansMapFormValue>,
  propRefs: RefsOf<FieldProps & HasChoicesMultipleFieldProps>,
) {
  const { choicesNormalized, possibleValues } = useHasChoices(propRefs);

  const valueIs = computed((): "array" | "object" => {
    return propRefs.valueIs?.value || "array";
  });

  const coerceToChoicesBooleansMap = (value: any): BooleansMapFormValue => {
    const partial = coerceToBooleansNativeMap(value);
    const out: BooleansMapFormValue = {};
    choicesNormalized.value.forEach((choice) => {
      const key = String(choice.key);
      out[key] = !!partial.get(key);
    });
    return out;
  };

  const coerceFn = (value: any): KeyListFormValue | BooleansMapFormValue => {
    if (valueIs.value == "array") {
      return coerceToKeyListFormValue(value);
    } else {
      return coerceToChoicesBooleansMap(value);
    }
  };

  const { modelValue, errors, field, FieldWrapper } = useFormField<KeyListFormValue | BooleansMapFormValue>(coerceFn, emit, propRefs);

  const toggle = (key: string | number): void => {
    if (valueIs.value == "array") {
      const newValue = coerceToKeyListFormValue(modelValue.value); // creates a copy
      if (newValue.includes(key)) {
        // This key is being turned off
        const index = newValue.indexOf(key);
        newValue.splice(index, 1);
        // We'll also need to shift error message indexes
        errors.value = reindexErrors(errors.value, (oldIndex) => {
          if (oldIndex === index) {
            // errors from the deleted key should be discarded
            return undefined;
          } else if (oldIndex > index) {
            // errors from keys after the deleted one will shift backwards one position
            return oldIndex - 1;
          } else {
            return oldIndex;
          }
        });
      } else {
        // This key is being turned on
        newValue.push(key);
      }
      modelValue.value = newValue;
    } else {
      const newValue = coerceToChoicesBooleansMap(modelValue.value); // creates a copy
      newValue[key] = !newValue[key];
      modelValue.value = newValue;
    }
  };

  const modelValueAsKeyList = computed(() => {
    return coerceToKeyListFormValue(modelValue.value);
  });

  const modelValueAsBooleansMap = computed(() => {
    return coerceToChoicesBooleansMap(modelValue.value);
  });

  const isOn = (key: string | number): boolean => {
    return !!modelValueAsBooleansMap.value[String(key)];
  };

  const subErrors = computed((): MessageBag => {
    const out: MessageBag = {};
    if (valueIs.value == "array") {
      // Then we should expect the errors to be indexed numerically
      choicesNormalized.value.forEach((choice) => {
        out[choice.key] = [];
      });
      coerceToKeyListFormValue(modelValue.value).forEach((key, index) => {
        out[key] = errors.value[index] || [];
      });
    } else {
      // Then we should expect the errors to be indexed by choice key
      choicesNormalized.value.forEach((choice) => {
        out[choice.key] = errors.value[choice.key] || [];
      });
    }
    return out;
  });

  const hasSubErrors = (key: string | number): boolean => {
    const errors = subErrors.value[String(key)] || [];
    return errors.length > 0;
  };

  return {
    modelValue,
    errors,
    field,
    FieldWrapper,
    choicesNormalized,
    possibleValues,
    valueIs,
    toggle,
    isOn,
    subErrors,
    hasSubErrors,
  };
}
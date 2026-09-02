import type { Ref } from "vue";
import { computed } from "vue";
import { Choosable, HasChoicesFieldProps, RefsOf } from "../types";
import useHasChoices from "./useHasChoices";

export default function useHasChoicesSingle (modelValue: Ref<string | number | null>, props: RefsOf<HasChoicesFieldProps>) {
  const { choicesNormalized, possibleValues } = useHasChoices(props);

  const currentChoice = computed((): Choosable | null => {
    for (const choice of choicesNormalized.value) {
      if (choice.key == modelValue.value) {
        return choice;
      }
    }
    return null;
  });

  const nullSelected = computed(() => {
    return (
      modelValue.value == null ||
      !possibleValues.value.includes(modelValue.value)
    );
  });

  const displayValue = computed((): string => {
    if (currentChoice.value) {
      return currentChoice.value.label;
    } else {
      return modelValue.value == null ? "" : String(modelValue.value);
    }
  });

  return { choicesNormalized, currentChoice, possibleValues, nullSelected, displayValue };
};

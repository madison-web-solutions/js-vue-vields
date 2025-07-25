import { computed, inject, ref, watchEffect } from "vue";
import { Choosable, HasChoicesFieldProps, RefsOf } from "../types";
import injectionSymbols from "./injection-symbols";
import { startCase } from "./utils";

export default function useHasChoices(props: RefsOf<HasChoicesFieldProps>) {
  const { directory, choices, extraParams } = props;

  const provider = inject(injectionSymbols.choicesProvider, undefined);

  const directoryChoices = ref<Choosable[]>([]);

  watchEffect(async () => {
    directoryChoices.value = [];
    if (directory == null || directory.value == null) {
      return;
    }
    if (provider == null) {
      console.log(`Warning, directory ${directory.value} specified in field but there is no choice list provider`);
      return;
    }
    const choiceListResult = await provider.getAll(directory.value, extraParams?.value || {});
    if (choiceListResult.status == "found") {
      directoryChoices.value = choiceListResult.resource;
    } else {
      console.log(`Warning, Failed to fetch choices for directory ${directory.value}`, {result: choiceListResult, extraParams});
    }
  });

  const isPartialChoosable = (obj: any): obj is { key: string | number; label?: unknown } => {
    return (
      typeof obj == "object" &&
      obj != null &&
      "key" in obj &&
      (typeof obj.key == "string" || typeof obj.key == "number")
    );
  };

  const choicesNormalized = computed((): Choosable[] => {
    if (directory != null && directory.value != null) {
      // Directory is specified, so use the set of choices from the provider
      return directoryChoices.value;
    }
    // Directory is not specified, so the set of choices should be specified as a prop instead
    const out: Choosable[] = [];
    if (choices == null || choices.value == null) {
      // No options
    } else if (Array.isArray(choices.value)) {
      for (const choice of choices.value) {
        if (typeof choice == "string") {
          out.push({ key: choice, label: startCase(choice) });
        } else if (isPartialChoosable(choice)) {
          out.push(
            Object.assign(
              {
                label:
                  typeof choice.label == "string"
                    ? choice.label
                    : startCase(choice.key),
              },
              choice,
            ),
          );
        } else {
          console.log(choices.value);
          throw "Invalid choice specification";
        }
      }
    } else if (typeof choices.value == "object") {
      // Assume object keys are option values and object values are option labels
      for (const [key, label] of Object.entries(choices.value)) {
        out.push({
          key: String(key),
          label: String(label),
        });
      }
    } else if (typeof choices.value == "string") {
      choices.value.split(",").forEach((key) => {
        out.push({ key: key.trim(), label: startCase(key) });
      });
    }
    return out;
  });

  const possibleValues = computed((): (string | number)[] => {
    return choicesNormalized.value.map((choice) => choice.key);
  });

  return { choicesNormalized, possibleValues };
};

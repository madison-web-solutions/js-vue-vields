import type { Ref } from "vue";
import type {
  CompoundFormValue,
  MessageBag,
  NamedLens,
  FormValue,
} from "../types";
import { provide } from "vue";
import injectionSymbols from "./injection-symbols";
import { copyCompoundFormValue } from "./type-utils";
import { spliceMessageBag, sliceMessageBag } from "./message-bag";

export default function useHasCompoundValue(
  modelValue: Ref<CompoundFormValue>,
  errors: Ref<MessageBag>
) {
  const valueLens: NamedLens<FormValue> = {
    lensType: "named",
    get: (name: string): FormValue => {
      return modelValue.value ? modelValue.value[name] : undefined;
    },
    getAll: (): Record<string, FormValue> => {
      return modelValue.value;
    },
    set: (name: string, newVal: FormValue) => {
      // make a copy of our value
      const modelValueCopy: CompoundFormValue = copyCompoundFormValue(
        modelValue.value
      );
      // set the new value
      modelValueCopy[name] = newVal;
      modelValue.value = modelValueCopy;
    },
  };

  provide(injectionSymbols.valueLens, valueLens);

  const errorsLens: NamedLens<MessageBag> = {
    lensType: "named",
    get: (name: string): MessageBag => {
      return sliceMessageBag(errors.value, name);
    },
    getAll: (): Record<string, MessageBag> => {
      const out: Record<string, MessageBag> = {};
      Object.entries(errors.value).forEach(([path, subErrors]) => {
        const parts = path.split(".");
        const prefix = parts.shift() ?? "";
        const rest = parts.join(".");
        if (!(prefix in out)) {
          out[prefix] = {};
        }
        out[prefix][rest] = subErrors.slice();
      });
      return out;
    },
    set: (name: string, newSubErrors: MessageBag) => {
      errors.value = spliceMessageBag(errors.value, name, newSubErrors);
    },
  };

  provide(injectionSymbols.errorsLens, errorsLens);
}

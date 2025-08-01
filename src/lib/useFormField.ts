import type { FormValue, MessageBag, FieldEmitType, FieldProps, FieldState, EditMode, RefsOf } from "../types";
import { computed, inject, ref, useId } from "vue";
import injectionSymbols from "./injection-symbols";
import useExtendsPath from "./useExtendsPath";
import StandardFieldWrapper from "../components/FieldWrapper.vue";

export default function useFormField<ValueType extends FormValue>(
  valueCoerceFn: (val: unknown) => ValueType,
  emit: FieldEmitType<ValueType>,
  propRefs: RefsOf<FieldProps>
) {
  const name = computed((): string | undefined => {
    return propRefs?.name?.value;
  });
  const index = computed((): number | undefined => {
    return propRefs?.index?.value;
  });
  const pathPart = computed((): string | undefined => {
    return name.value == null
      ? index.value == null
        ? undefined
        : String(index.value)
      : name.value;
  });

  const { path, pathString } = useExtendsPath(pathPart);

  const valueLens = inject(injectionSymbols.valueLens, undefined);

  // @todo
  // Warn of ambiguities about the data bindings from incorrect use
  // For example if there's both a v-model and a name, or an indexedLens with no index, etc

  const rawValue = computed(() => {
    if (valueLens && valueLens.lensType == "fixed") {
      return valueLens.get();
    }
    if (name.value && valueLens && valueLens.lensType == "named") {
      return valueLens.get(name.value);
    }
    if (index.value != null && valueLens && valueLens.lensType == "indexed") {
      return valueLens.get(index.value);
    }
    return propRefs?.modelValue?.value;
  });

  const setNewValue = (newVal: ValueType) => {
    if (valueLens && valueLens.lensType == "fixed") {
      valueLens.set(newVal);
    } else if (name.value && valueLens && valueLens.lensType == "named") {
      valueLens.set(name.value, newVal);
    } else if (
      index.value != null &&
      valueLens &&
      valueLens.lensType == "indexed"
    ) {
      valueLens.set(index.value, newVal);
    } else {
      emit("update:modelValue", newVal);
    }
  };

  const modelValue = computed({
    get: (): ValueType => {
      return valueCoerceFn(rawValue.value);
    },
    set: (newVal: ValueType) => {
      setNewValue(newVal);
    },
  });

  const errorsLens = inject(injectionSymbols.errorsLens, undefined);

  // All error messages for this field and any nested subfields
  const errors = computed({
    get: (): MessageBag => {
      if (errorsLens && errorsLens.lensType == "fixed") {
        return errorsLens.get();
      }
      if (name.value && errorsLens && errorsLens.lensType == "named") {
        return errorsLens.get(name.value);
      }
      if (
        index.value != null &&
        errorsLens &&
        errorsLens.lensType == "indexed"
      ) {
        return errorsLens.get(index.value);
      }
      return propRefs?.errors?.value || {};
    },
    set: (newErrors: MessageBag) => {
      if (errorsLens && errorsLens.lensType == "fixed") {
        errorsLens.set(newErrors);
      } else if (name.value && errorsLens && errorsLens.lensType == "named") {
        errorsLens.set(name.value, newErrors);
      } else if (
        index.value != null &&
        errorsLens &&
        errorsLens.lensType == "indexed"
      ) {
        errorsLens.set(index.value, newErrors);
      } else {
        emit("update:errors", newErrors);
      }
    },
  });

  // Error messages specifically for this field
  const myErrors = computed((): string[] => {
    return errors.value[""] || [];
  });

  const hasError = computed((): boolean => {
    return myErrors.value.length > 0;
  });

  const editModeInjected = inject(injectionSymbols.editMode, undefined);
  const editMode = computed((): EditMode => {
    return editModeInjected?.value ?? 'edit';
  });

  const inputEleId = useId();

  const FieldWrapper = inject(injectionSymbols.fieldWrapperComponent) || StandardFieldWrapper;

  const field = computed((): FieldState<ValueType> => {
    return {
        path: path.value,
        pathString: pathString.value,
        rawValue: rawValue.value,
        modelValue: modelValue.value,
        errors: errors.value,
        myErrors: myErrors.value,
        hasError: hasError.value,
        editMode: editMode.value,
        inputEleId: inputEleId,

        label: propRefs.label?.value,
        required: propRefs.required?.value ?? false,
        disabled: propRefs.disabled?.value ?? false,
        autocomplete: propRefs.autocomplete?.value,
        help: propRefs.help?.value,
        placeholder: propRefs.placeholder?.value,
    };
  });

  return {
    modelValue,
    errors,
    field,
    FieldWrapper,
  };
}

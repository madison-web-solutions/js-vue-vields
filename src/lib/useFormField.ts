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

  // Binding precedence: an explicit v-model / v-model:errors on this field
  // takes priority over any lens an ancestor has injected, and the field
  // becomes the root of a new data context (its descendants see a fresh path
  // and the new NamedLens that container fields provide from this v-model).
  //
  // We treat "value defined" as "explicit binding" — the simplest signal that
  // can be tracked reactively. The trade-off is that `v-model="ref(undefined)"`
  // is interpreted as "no binding, inherit from the lens". Users who want the
  // v-model ref to own the field even when empty should initialise it to
  // `null` or an empty string rather than `undefined`.
  const hasExplicitValueBinding = computed((): boolean => {
    return propRefs?.modelValue?.value !== undefined;
  });
  const hasExplicitErrorsBinding = computed((): boolean => {
    return propRefs?.errors?.value !== undefined;
  });

  const { path, pathString } = useExtendsPath(pathPart, hasExplicitValueBinding);

  const valueLens = inject(injectionSymbols.valueLens, undefined);

  const rawValue = computed(() => {
    if (hasExplicitValueBinding.value) {
      return propRefs.modelValue!.value;
    }
    if (valueLens && valueLens.lensType == "fixed") {
      return valueLens.get();
    }
    if (name.value && valueLens && valueLens.lensType == "named") {
      return valueLens.get(name.value);
    }
    if (index.value != null && valueLens && valueLens.lensType == "indexed") {
      return valueLens.get(index.value);
    }
    return undefined;
  });

  const setNewValue = (newVal: ValueType) => {
    if (hasExplicitValueBinding.value) {
      emit("update:modelValue", newVal);
      return;
    }
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
      if (hasExplicitErrorsBinding.value) {
        return propRefs.errors!.value!;
      }
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
      return {};
    },
    set: (newErrors: MessageBag) => {
      if (hasExplicitErrorsBinding.value) {
        emit("update:errors", newErrors);
        return;
      }
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

  const FieldWrapper = inject(injectionSymbols.fieldWrapperComponent, undefined) || StandardFieldWrapper;

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

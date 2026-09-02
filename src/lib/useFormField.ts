import type { FormValue, MessageBag, FieldEmitType, FieldProps, FieldState, EditMode, RefsOf } from "../types";
import { computed, inject, useId } from "vue";
import injectionSymbols from "./injection-symbols";
import useExtendsPath from "./useExtendsPath";
import { useFieldBinding, formValueStrategy, formErrorsStrategy } from "./context";
import StandardFieldWrapper from "../components/FieldWrapper.vue";

// Default test for whether a field has no value (FieldWrapper shows the configured noValueLabel
// in view mode when this is true). Applied to the coerced value, so a field whose coerce function
// never yields one of these (e.g. Checkbox → boolean) is never empty. Plain objects are not empty:
// a compound renders its children, which report their own emptiness.
const isEmpty = (val: unknown): boolean => {
  return val == null || val === "" || (Array.isArray(val) && val.length === 0);
};

export type UseFormFieldOptions<ValueType> = {
  // Override the default emptiness test for this field
  isEmpty?: (val: ValueType) => boolean;
};

const useFormField = <ValueType extends FormValue>(
  valueCoerceFn: (val: unknown) => ValueType,
  emit: FieldEmitType<ValueType>,
  propRefs: RefsOf<FieldProps>,
  opts?: UseFormFieldOptions<ValueType>
) => {
  const name = computed((): string | undefined => {
    return propRefs?.name?.value;
  });
  const index = computed((): number | undefined => {
    return propRefs?.index?.value;
  });
  // The single key by which this field addresses its value within the parent's provided
  // value: a string (from `name`) addresses an object property, a number (from `index`) an
  // array index. Keep the real type — do not stringify the index.
  const nameOrIndex = computed((): string | number | undefined => {
    return name.value ?? index.value;
  });

  // Binding precedence: an explicit v-model / v-model:errors on this field takes priority over
  // the parent context — the field becomes the owner of its own value/errors (its descendants
  // bind into that value instead). A field that owns its value is the root of a fresh context.
  //
  // We treat "value defined" as "explicit binding" — the simplest signal that can be tracked
  // reactively. The trade-off is that `v-model="ref(undefined)"` is read as "no binding, inherit
  // from the parent". Callers who want the v-model ref to own the field even when empty should
  // initialise it to `null` or an empty string rather than `undefined`.
  const ownsValue = computed((): boolean => {
    return propRefs?.modelValue?.value !== undefined;
  });
  // Owning the value also resets the errors context: a v-model ignores the field's name, which
  // severs the name-based route to the parent's errors. So errors then come from v-model:errors
  // (if given) or are empty — never inherited by the (now-ignored) name. v-model:errors owns
  // errors on its own too.
  const ownsErrors = computed((): boolean => {
    return ownsValue.value || propRefs?.errors?.value !== undefined;
  });

  const { path, pathString } = useExtendsPath(nameOrIndex, ownsValue);

  const rawValue = useFieldBinding(
    formValueStrategy,
    nameOrIndex,
    ownsValue,
    () => propRefs.modelValue?.value,
    (newVal) => emit("update:modelValue", newVal as ValueType)
  );

  const modelValue = computed({
    get: (): ValueType => {
      return valueCoerceFn(rawValue.value);
    },
    set: (newVal: ValueType) => {
      rawValue.value = newVal;
    },
  });

  // All error messages for this field and any nested subfields
  const errors = useFieldBinding(
    formErrorsStrategy,
    nameOrIndex,
    ownsErrors,
    () => propRefs.errors?.value ?? {},
    (newErrors) => emit("update:errors", newErrors)
  );

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

  // Move keyboard focus to this field's input element. Fields expose this via defineExpose, so a
  // caller holding a template ref can focus a field (e.g. the first one with a validation error);
  // the browser scrolls the element into view as part of focusing it. Fields whose input can't be
  // reached by inputEleId — a hidden value input backing a pair of sub-fields, or a third party
  // editor — override this with their own implementation.
  const focus = () => {
    document.getElementById(inputEleId)?.focus();
  };

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
        isEmpty: (opts?.isEmpty ?? isEmpty)(modelValue.value),
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
    focus,
  };
};

export default useFormField;

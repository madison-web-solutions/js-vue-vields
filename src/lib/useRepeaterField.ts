import type {
  FieldEmitType,
  FormValue,
  RepeaterFormValue,
  FieldProps,
  RepeaterFieldProps,
  RepeaterItem,
  RefsOf,
} from "../types";
import { computed, ref, onBeforeUnmount } from "vue";
import useFormField from './useFormField';
import { provideFormValues } from "./context";
import { sliceMessageBag, reindexErrors } from './message-bag';
import {
  coerceToRepeaterFormValue,
  arrayAppend,
  arrayInsert,
  arrayRemove,
  arrayMove,
} from "./type-utils";

const useRepeaterField = (
  emit: FieldEmitType<RepeaterFormValue>,
  propRefs: RefsOf<FieldProps & RepeaterFieldProps>,
) => {
  const newRowValue = (): FormValue => {
    return null;
  };

  const canAddRow = computed((): boolean => {
    return (
      propRefs.max?.value == null ||
      modelValue.value.length < propRefs.max.value
    );
  });

  const coerceFn = (value: unknown): RepeaterFormValue => {
    const out = coerceToRepeaterFormValue(value);
    addEnoughRows(out);
    return out;
  };

  const { modelValue, errors, field, FieldWrapper } = useFormField<RepeaterFormValue>(coerceFn, emit, propRefs);

  const addEnoughRows = (value: RepeaterFormValue) => {
    if (propRefs.min?.value != null) {
      while (value.length < propRefs.min.value) {
        value.push(newRowValue());
      }
    }
  };

  const appendRow = (): void => {
    modelValue.value = arrayAppend(modelValue.value, newRowValue());
  };

  const insertRowAt = (index: number): void => {
    modelValue.value = arrayInsert(modelValue.value, index, newRowValue());

    // update indices in error messages so that errors remain attached to the right row
    errors.value = reindexErrors(errors.value, (oldIndex) => {
      if (oldIndex >= index) {
        // errors from rows after the inserted one will shift forwards one position
        return oldIndex + 1;
      } else {
        return oldIndex;
      }
    });
  };

  const deleteRowAt = (index: number): void => {
    const next = arrayRemove(modelValue.value, index);
    // add rows if necessary to meet minimum requirement
    addEnoughRows(next);
    modelValue.value = next;

    // update indices in error messages so that errors remain attached to the right row
    errors.value = reindexErrors(errors.value, (oldIndex) => {
      if (oldIndex === index) {
        // errors from the deleted row should be discarded
        return undefined;
      } else if (oldIndex > index) {
        // errors from rows after the deleted one will shift backwards one position
        return oldIndex - 1;
      } else {
        return oldIndex;
      }
    });
  };

  const movable = computed((): boolean => {
    return (
      modelValue.value.length > 0 &&
      !!propRefs.movable?.value &&
      !propRefs.disabled?.value &&
      field.value.editMode == "edit"
    );
  });

  const move = (from: number, to: number): void => {
    if (movable.value == false || from === to) {
      return;
    }
    modelValue.value = arrayMove(modelValue.value, from, to);

    // update indices in error messages so that errors remain attached to the right row
    errors.value = reindexErrors(errors.value, (oldIndex) => {
      if (oldIndex === from) {
        return to;
      } else if (from > to && oldIndex >= to && oldIndex < from) {
        return oldIndex + 1;
      } else if (to > from && oldIndex > from && oldIndex <= to) {
        return oldIndex - 1;
      } else {
        return oldIndex;
      }
    });
  };

  // Provide our (coerced, min-padded) array as the value the rows bind into. Each
  // FieldArrayItem focuses it at its index; the out-of-range guard in setValueAt
  // ignores stale writes from a row that has just been removed.
  provideFormValues(modelValue, errors);

  const movingIndex = ref<number | undefined>(undefined);
  const isMoving = computed((): boolean => {
    return movingIndex.value != null;
  });
  const startMove = (index: number) => {
    movingIndex.value = index;
    document.addEventListener("keydown", handleMoveEscape);
  };
  const handleMoveEscape = (e: KeyboardEvent) => {
    if (e.key == "Escape") {
      cancelMove();
    }
  };
  const completeMoveTo = (to: number) => {
    if (movingIndex.value != null) {
      move(movingIndex.value, to);
      cancelMove();
    }
  };
  const cancelMove = () => {
    movingIndex.value = undefined;
    document.removeEventListener("keydown", handleMoveEscape);
  };
  onBeforeUnmount(cancelMove);

  const loopItems = computed((): RepeaterItem[] => {
    const lastIndex = modelValue.value.length - 1;
    return modelValue.value.map(
      (rowVals: FormValue, index: number): RepeaterItem => {
        const childErrors = sliceMessageBag(errors.value, String(index));
        const rowErrors = childErrors[""] || [];
        return {
          index: index,
          isFirst: (index == 0),
          isLast: (index == lastIndex),
          rowVals: rowVals,
          rowErrors: rowErrors,
          showRowErrors: field.value.editMode == "edit" && rowErrors.length > 0,
          childErrors: childErrors,
          insertRowBefore: () => insertRowAt(index),
          insertRowAfter: () => insertRowAt(index + 1),
          deleteRow: () => deleteRowAt(index),
          startMove: () => startMove(index),
          completeMoveBefore: () => {
            if (movingIndex.value != null) {
              completeMoveTo(index > movingIndex.value ? index - 1 : index);
            }
          },
          completeMoveAfter: () => {
            if (movingIndex.value != null) {
              completeMoveTo(index < movingIndex.value ? index + 1 : index);
            }
          },
        };
      },
    );
  });

  return {
    modelValue,
    errors,
    field,
    FieldWrapper,
    canAddRow,
    appendRow,
    insertRowAt,
    deleteRowAt,
    movable,
    move,
    movingIndex,
    isMoving,
    startMove,
    completeMoveTo,
    cancelMove,
    loopItems,
  };
};

export default useRepeaterField;

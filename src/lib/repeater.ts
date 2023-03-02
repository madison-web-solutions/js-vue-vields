
export type RepeaterTableColOpts = {
    name: string,
    label?: string | null | undefined,
};

export type RepeaterTableCol = {
    name: string,
    label: string,
};

import type { Ref } from 'vue';
import type { RepeaterFormValue, MessageBag, FormValue, UseFormFieldOpts, IndexedLens } from '@/main';
import type { FieldEmitType, UseFormFieldPropRefs } from './field';
import { computed, provide, ref, onBeforeUnmount } from 'vue';
import { useFormField, sliceMessageBag, spliceMessageBag, coerceToCompoundFormValue, coerceToRepeaterFormValue, copyRepeaterFormValue, reindexErrors, symbols } from '@/main';

export type UseRepeaterFieldPropRefs = UseFormFieldPropRefs<RepeaterFormValue> & {
    min?: Ref<number | undefined>,
    max?: Ref<number | undefined>,
};

export function useRepeaterField(emit: FieldEmitType<RepeaterFormValue>, propRefs: UseRepeaterFieldPropRefs, opts?: UseFormFieldOpts ) {

    const canAddRow = computed((): boolean => {
        return propRefs.max?.value == null || modelValue.value.length < propRefs.max.value;
    });

    const coerceFn = (value: unknown): RepeaterFormValue => {
        const out = coerceToRepeaterFormValue(value);
        addEnoughRows(out);
        return out;
    };

    const { inputEleId, modelValue, errors, myErrors, editMode, FieldWrapper, standardWrapperProps } = useFormField<RepeaterFormValue>(coerceFn, emit, propRefs, opts);

    const addEnoughRows = (value: RepeaterFormValue) => {
        if (propRefs.min?.value != null) {
            while (value.length < propRefs.min.value) {
                value.push({});
            }
        }
    };

    const appendRow = (): void => {
        // make a copy of our array
        const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
        // add the new row
        modelValueCopy.push({});
        // set our new value
        modelValue.value = modelValueCopy;
    };

    const insertRowAt = function(index: number): void {
        // make a copy of our array
        const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
        // insert the new row at index
        modelValueCopy.splice(index, 0, {});
        // set our new value
        modelValue.value = modelValueCopy;

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
        // make a copy of our array
        const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
        // remove the row at index
        modelValueCopy.splice(index, 1);
        // add rows if necessary to meet minimum requirement
        addEnoughRows(modelValueCopy);
        // set our new value
        modelValue.value = modelValueCopy;
    
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

    const move = (from: number, to: number): void => {
        if (from === to) {
            return;
        }
        // make a copy of our array
        const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
        // move the row to it's new position
        const itemBeingMoved: FormValue = modelValueCopy.splice(from, 1)[0];
        modelValueCopy.splice(to, 0, itemBeingMoved);
        // set our new value
        modelValue.value = modelValueCopy;

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

    const valueLens: IndexedLens<FormValue> = {
        lensType: 'indexed',
        get: (index: number): FormValue => {
            return modelValue.value ? modelValue.value[index] : undefined;
        },
        set: (index: number, newVal: FormValue) => {
            // make a copy of our value
            const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
            // set the new value
            modelValueCopy[index] = coerceToCompoundFormValue(newVal);
            modelValue.value = modelValueCopy;
        },
    };

    provide(symbols.valueLens, valueLens);

    const errorsLens: IndexedLens<MessageBag> = {
        lensType: 'indexed',
        get: (index: number): MessageBag => {
            return sliceMessageBag(errors.value, String(index));
        },
        set: (index: number, newSubErrors: MessageBag) => {
            errors.value = spliceMessageBag(errors.value, String(index), newSubErrors);
        }
    };
    
    provide(symbols.errorsLens, errorsLens);

    const movingIndex = ref<number | undefined>(undefined);
    const isMoving = computed((): boolean => {
        return movingIndex.value != null;
    });
    const startMove = (index: number) => {
        movingIndex.value = index;
        document.addEventListener('keydown', handleMoveEscape);
    };
    const handleMoveEscape = (e: KeyboardEvent) => {
        if (e.key == 'Escape') {
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
        document.removeEventListener('keydown', handleMoveEscape);
    };
    onBeforeUnmount(cancelMove);


    return {
        inputEleId,
        modelValue,
        errors,
        myErrors,
        editMode,
        FieldWrapper,
        standardWrapperProps,
        canAddRow,
        appendRow,
        insertRowAt,
        deleteRowAt,
        move,
        movingIndex,
        isMoving,
        startMove,
        completeMoveTo,
        cancelMove,
    };
};

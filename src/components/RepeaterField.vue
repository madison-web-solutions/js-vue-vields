<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="repeater">
                <div class="repeater-item" :class="{'is-moving': index === movingIndex}" :style="itemStyle(index)" v-for="(rowVals, index) in modelValue">
                    <div class="repeater-item-control">
                        <div>{{ index }}</div>
                        <div v-if="editMode == 'edit'" class="btn-group">
                            <button class="btn btn-outline-primary" @click="insertRowAt(index)"><i class="fas fa-plus"></i></button>
                            <button class="btn btn-outline-primary" @click="startMove(index)"><i class="fas fa-arrows-alt"></i></button>
                            <button class="btn btn-outline-danger" @click="deleteRowAt(index)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <RepeaterRow class="repeater-item-content" :index="index" :subVals="rowVals">
                        <template v-slot="{ subVals }">
                            <slot :index="index" :subVals="subVals"></slot>
                        </template>
                    </RepeaterRow>
                    <template v-if="editMode == 'edit' && movingIndex != null">
                        <div v-if="movingIndex - index >= 0" class="repeater-move-target move-before" @click="completeMoveTo(index)"></div>
                        <div v-if="movingIndex - index > 0" class="repeater-move-target move-after" @click="completeMoveTo(index + 1)"></div>
                        <div v-if="index - movingIndex > 0" class="repeater-move-target move-before" @click="completeMoveTo(index - 1)"></div>
                        <div v-if="index - movingIndex >= 0" class="repeater-move-target move-after" @click="completeMoveTo(index)"></div>
                    </template>
                </div>
            </div>
            <div v-if="editMode == 'edit'" class="repeater-append">
                <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue';
import type { RepeaterFormValue, MessageBag, FormValue } from '@/main';
import { computed, provide, ref, toRefs, onBeforeUnmount } from 'vue';
import { commonProps, useFormField, spliceMessageBag, getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, copyRepeaterFormValue, coerceToArrayKey, reindexErrors, symbols } from '@/main';
import { RepeaterRow, FieldWrapper } from '@/main';

// @todo min, max

const props = defineProps(Object.assign({}, commonProps, {
    appendLabel: {
        type: String,
        default: 'Add Row',
    }
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const { inputEleId, modelValue, errors, myErrors, editMode } = useFormField<RepeaterFormValue>(coerceToRepeaterFormValue, emit, propRefs);

// provide the setter
const setter = ref((value: FormValue, key: string | number): void => {
    const index = coerceToArrayKey(key);
    if (index != null) {
        // make a copy of our array
        const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
        // set our new value
        modelValueCopy[index] = coerceToCompoundFormValue(value);
        modelValue.value = modelValueCopy;
    }
});

provide(symbols.setter, setter);

const errorsSetter = ref((newSubErrors: MessageBag, key: string | number): void => {
    errors.value = spliceMessageBag(errors.value, String(key), newSubErrors);
});

provide(symbols.errorsSetter, errorsSetter);

const appendRow = (): void => {
    // make a copy of our array
    const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
    // add the new row
    modelValueCopy.push({});
    // set our new value
    modelValue.value = modelValueCopy;
};

const deleteRowAt = (index: number): void => {
    // make a copy of our array
    const modelValueCopy: RepeaterFormValue = copyRepeaterFormValue(modelValue.value);
    // remove the row at index
    modelValueCopy.splice(index, 1);
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

const movingIndex = ref<number | null>(null);
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
    movingIndex.value = null;
    document.removeEventListener('keydown', handleMoveEscape);
};
onBeforeUnmount(cancelMove);

const itemStyle = (index: number) => {
    // TypeScript doesn't know that CSS custom variable names are valid in a Style object
    // So we have to 'trick' the compiler and explicitly cast to StyleValue
    return {'--row-num': (index + 1)} as StyleValue;
};

</script>

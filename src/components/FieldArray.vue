<template>
    <slot name="beforeLoop" :appendRow="appendRow" :insertRowAt="insertRowAt" :deleteRowAt="deleteRowAt"></slot>
    <FieldGroup v-for="item in loopItems" :index="item.index">
        <slot v-bind="item"></slot>
    </FieldGroup>
    <slot name="afterLoop" :appendRow="appendRow" :insertRowAt="insertRowAt" :deleteRowAt="deleteRowAt"></slot>
</template>

<script setup lang="ts">

import type { MessageBag, RepeaterFormValue, CompoundFormValue } from '@/main';
import { computed, provide, ref, toRefs } from 'vue';
import { FieldGroup, useRepeaterField, sliceMessageBag, spliceMessageBag, useFormField, coerceToCompoundFormValue, copyCompoundFormValue, symbols } from '@/main';

const props = defineProps<{
    modelValue?: any,
    errors?: MessageBag,
    name?: string,
    index?: number,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    modelValue,
    errors,
    appendRow,
    insertRowAt,
    deleteRowAt,
} = useRepeaterField(emit, propRefs);

type LoopItem = {
    index: number,
    rowVals: CompoundFormValue,
    rowErrors: string[],
    childErrors: MessageBag,
    insertRowBefore: () => void,
    insertRowAfter: () => void,
    deleteRow: () => void,
};

const loopItems = computed((): LoopItem[] => {
    return modelValue.value.map((rowVals: CompoundFormValue, index: number): LoopItem => {
        const childErrors = sliceMessageBag(errors.value, String(index));
        return {
            index: index,
            rowVals: rowVals,
            rowErrors: childErrors[''] || [],
            childErrors: childErrors,
            insertRowBefore: () => insertRowAt(index - 1),
            insertRowAfter: () => insertRowAt(index + 1),
            deleteRow: () => deleteRowAt(index),
        };
    });
});

</script>

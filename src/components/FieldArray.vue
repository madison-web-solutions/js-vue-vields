<template>
    <slot name="beforeLoop" :appendRow="appendRow" :insertRowAt="insertRowAt" :deleteRowAt="deleteRowAt"></slot>
    <FieldArrayItem v-for="item in loopItems" :index="item.index">
        <slot v-bind="item"></slot>
    </FieldArrayItem>
    <slot name="afterLoop" :appendRow="appendRow" :insertRowAt="insertRowAt" :deleteRowAt="deleteRowAt"></slot>
</template>

<script setup lang="ts">
import type { MessageBag, RepeaterFormValue } from '@/main';
import { toRefs } from 'vue';
import { FieldArrayItem, useRepeaterField } from '@/main';

const props = defineProps<{
    modelValue?: any,
    errors?: MessageBag,
    name?: string,
    index?: number,
    min?: number,
    max?: number,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    appendRow,
    insertRowAt,
    deleteRowAt,
    loopItems,
} = useRepeaterField(emit, propRefs);

</script>

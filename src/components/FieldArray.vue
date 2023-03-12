<template>
    <slot name="beforeLoop" :canAddRow="canAddRow" :appendRow="appendRow" :insertRowAt="insertRowAt" :deleteRowAt="deleteRowAt"></slot>
    <slot :loopItems="loopItems"></slot>
    <slot name="afterLoop" :canAddRow="canAddRow" :appendRow="appendRow" :insertRowAt="insertRowAt" :deleteRowAt="deleteRowAt"></slot>
</template>

<script setup lang="ts">
import type { MessageBag, RepeaterFormValue, Config } from '@/main';
import { toRefs } from 'vue';
import { useRepeaterField, useExtendsConfig } from '@/main';

const props = defineProps<{
    modelValue?: any,
    errors?: MessageBag,
    name?: string,
    index?: number,
    min?: number,
    max?: number,
    config?: Partial<Config>,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    canAddRow,
    appendRow,
    insertRowAt,
    deleteRowAt,
    loopItems,
} = useRepeaterField(emit, propRefs);

useExtendsConfig(propRefs.config);

</script>

<template>
    <slot></slot>
</template>

<script setup lang="ts">

import type { MessageBag, CompoundFormValue, EditMode, Config } from '../main';
import { toRefs } from 'vue';
import { useFormField, useHasCompoundValue, coerceToCompoundFormValue, useExtendsEditMode, useExtendsConfig } from '../main';

const props = defineProps<{
    modelValue?: any,
    errors?: MessageBag,
    name?: string,
    index?: number,
    editMode?: EditMode,
    config?: Partial<Config>,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const slots = defineSlots<{
    default: (props: {}) => any,
}>();

const propRefs = toRefs(props);

const { modelValue, errors } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

useHasCompoundValue(modelValue, errors);

useExtendsEditMode(propRefs.editMode);
useExtendsConfig(propRefs.config);

</script>

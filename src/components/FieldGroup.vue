<template>
    <slot></slot>
</template>

<script setup lang="ts">

import type { MessageBag, CompoundFormValue, Config } from '@/main';
import { toRefs } from 'vue';
import { useFormField, useHasCompoundValue, coerceToCompoundFormValue, useExtendsConfig } from '@/main';

const props = defineProps<{
    modelValue?: any,
    errors?: MessageBag,
    name?: string,
    index?: number,
    config?: Partial<Config>,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const { modelValue, errors } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

useHasCompoundValue(modelValue, errors);

useExtendsConfig(propRefs.config);

</script>

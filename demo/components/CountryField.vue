<template>
    <SelectField v-bind="fieldProps" v-model="modelValue" v-model:errors="errors" :choices="countries" />
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { computed } from 'vue';
import { commonProps } from '@/main';
import { SelectField } from '@/main';

type IdType = string | undefined;

const props = defineProps(commonProps);

const emit = defineEmits<{
    (e: 'update:modelValue', value: IdType): void
    (e: 'update:errors', value: MessageBag): void
}>();

const fieldProps = computed(() => {
    return {
        label: props.label,
        required: props.required,
        disabled: props.disabled,
        help: props.help,
        placeholder: props.placeholder,
        name: props.name,
    };
});

const modelValue = computed({
    get: (): IdType => props.modelValue ? String(props.modelValue) : undefined,
    set: (newValue: IdType) => emit('update:modelValue', newValue)
});

const errors = computed({
    get: (): MessageBag => props.errors || {},
    set: (newErrors: MessageBag) => emit('update:errors', newErrors)
});

const countries = [
    {key: 'GB', label: 'United Kingdom'},
    {key: 'FR', label: 'France'},
];

</script>

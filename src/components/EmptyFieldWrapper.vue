<template>
    <slot name="input"></slot>
</template>

<script setup lang="ts">
import type { EditMode } from '@/main';

// We need this to make this component compatible with the regular FieldWrapper
// @todo we must be able to avoid this repetition somehow
const props = withDefaults(defineProps<{
    inputEleId?: string,
    label?: string,
    required: boolean,
    help?: string,
    tooltip?: string,
    modelValue?: any,
    errors?: string[],
    fieldTypeSlug?: string,
    inputWrapperCssClass?: string | string[] | object,
    editMode?: EditMode,
}>(), {
    required: false,
    inputWrapperCssClass: 'position-relative',
    editMode: 'edit',
});

</script>

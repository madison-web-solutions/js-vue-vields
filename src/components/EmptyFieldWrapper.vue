<template>
    <slot name="input"></slot>
</template>

<script setup lang="ts">
import type { EditMode, Path } from '@/main';

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
    path?: Path,
    editMode?: EditMode,
    inputWrapperCssClass?: string | string[] | object,
}>(), {
    required: false,
    inputWrapperCssClass: 'position-relative',
    editMode: 'edit',
});

</script>

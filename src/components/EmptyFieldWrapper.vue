<template>
    <slot name="input"></slot>
</template>

<script setup lang="ts">
import type { EditMode, Path } from '../main';

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
props; // This is here just to stop tsc saying we declared props but didn't use it

const slots = defineSlots<{
    label: (props: {}) => any,
    preinput: (props: {}) => any,
    input: (props: {}) => any,
    viewMode: (props: {}) => any,
    viewModeNoValue: (props: {}) => any,
    errors: (props: {}) => any,
}>();

</script>

<template>
    <div>
        <slot name="label">
            <label v-if="label" :for="inputEleId" class="form-label">{{ label }}<span v-if="required">*</span></label>
        </slot>
        <slot name="preinput"></slot>
        <div v-if="editMode == 'edit'" :class="inputWrapperCssClass">
            <slot name="input"></slot>
        </div>
        <slot v-if="editMode == 'edit'" name="errors">
            <div v-if="hasError" class="invalid-feedback d-block">
                <div class="error" v-for="msg in errors">{{ msg }}</div>
            </div>
        </slot>
        <div v-if="editMode == 'view'">
            <slot v-if="! hasNoValue" name="viewMode">
                <slot name="input"></slot>
            </slot>
            <slot v-if="hasNoValue" name="viewModeNoValue">
                <span class="text-muted">{{ noValueLabel }}</span>
            </slot>
        </div>
        <small v-if="help" class="form-text text-muted">{{ help }}</small>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, toRefs } from 'vue';
import { symbols } from '@/main';

const props = withDefaults(defineProps<{
    label?: string,
    required: boolean,
    help?: string,
    errors?: string[],
    inputEleId?: string,
    inputWrapperCssClass?: string | string[] | object,
    modelValue?: any,
}>(), {
    required: false,
    inputWrapperCssClass: 'position-relative'
});

const editMode = inject(symbols.editMode, ref('edit'));

const hasNoValue = computed(() => {
    return props.modelValue == null || props.modelValue === '';
});
const noValueLabel = inject(symbols.noValueLabel, ref('(None)'));

const { errors } = toRefs(props);

const hasError = computed(() => {
    return errors != null && errors.value != null && errors.value.length > 0;
});

</script>

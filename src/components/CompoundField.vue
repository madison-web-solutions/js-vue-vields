<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <slot :subVals="modelValue"></slot>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">

import type { MessageBag, CompoundFormValue } from '@/main';
import { toRefs } from 'vue';
import { commonProps, useFormField, useHasCompoundValue, coerceToCompoundFormValue } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const { modelValue, errors, FieldWrapper, standardWrapperProps } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs, {
    fieldTypeSlug: 'compound'
});

useHasCompoundValue(modelValue, errors);

</script>

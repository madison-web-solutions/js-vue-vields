<template>
    <div :class="{'is-invalid': showRowErrors}">
        <slot :subVals="modelValue"></slot>
        <div v-if="showRowErrors" class="invalid-feedback d-block">
            <div v-for="msg in myErrors">{{ msg }}</div>
        </div>
    </div>
</template>


<script setup lang="ts">
import type { MessageBag, CompoundFormValue } from '@/main';
import { computed, toRef } from 'vue';
import { useFormField, useHasCompoundValue, coerceToCompoundFormValue } from '@/main';

const props = defineProps<{
    index: number,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = {
    index: toRef(props, 'index'),
};

const { modelValue, errors, myErrors, editMode } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

useHasCompoundValue(modelValue, errors);

const showRowErrors = computed((): boolean => {
    return editMode.value == 'edit' && myErrors.value.length > 0;
});

</script>

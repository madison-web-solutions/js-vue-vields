<template>
    <slot></slot>
</template>

<script setup lang="ts">

import type { MessageBag, CompoundFormValue, FormValue } from '@/main';
import { provide, ref, toRef } from 'vue';
import { spliceMessageBag, useFormField, coerceToCompoundFormValue, copyCompoundFormValue, symbols } from '@/main';

const props = defineProps<{
    modelValue?: any,
    errors?: MessageBag,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();


const propRefs = {
    modelValue: toRef(props, 'modelValue'),
    errors: toRef(props, 'errors'),
    name: undefined,
};

const { modelValue, errors } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

// provide the setter
const setter = ref((value: FormValue, key: string | number): void => {
    // make a copy of our value
    const modelValueCopy: CompoundFormValue = copyCompoundFormValue(modelValue.value);
    // set our new value
    modelValueCopy[String(key)] = value;
    modelValue.value = modelValueCopy;
});

provide(symbols.setter, setter);

const errorsSetter = ref((newSubErrors: MessageBag, key: string | number): void => {
    errors.value = spliceMessageBag(errors.value, String(key), newSubErrors);
});

provide(symbols.errorsSetter, errorsSetter);

</script>

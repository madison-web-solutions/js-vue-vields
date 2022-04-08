<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <slot></slot>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">

import type { MessageBag, CompoundFormValue, FormValue } from '@/main';
import { provide, ref, toRefs } from 'vue';
import { commonProps, spliceMessageBag, useFormField, coerceToCompoundFormValue, copyCompoundFormValue, symbols } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const { inputEleId, modelValue, errors, myErrors, editMode } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

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

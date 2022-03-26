<template>
    <div>
        <slot :subVals="modelValue"></slot>
        <div v-if="editMode == 'edit' && myErrors.length" class="invalid-feedback d-block">
            <div v-for="msg in myErrors">{{ msg }}</div>
        </div>
    </div>
</template>


<script setup lang="ts">
import type { MessageBag, FormValue, CompoundFormValue } from '@/main';
import { ref, toRef, provide } from 'vue';
import { useFormField, spliceMessageBag, coerceToCompoundFormValue, copyCompoundFormValue, symbols } from '@/main';

const props = defineProps<{
    index: number,
    subVals: CompoundFormValue,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = {
    modelValue: undefined,
    errors: undefined,
    name: toRef(props, 'index'),
};

const { modelValue, errors, myErrors, editMode } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

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

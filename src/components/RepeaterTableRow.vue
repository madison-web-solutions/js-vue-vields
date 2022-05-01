<template>
    <tr>
        <td class="repeater-item-control">
            <div>
                <button v-if="editMode == 'edit'" class="btn btn-repeater-move" @click="emit('startMove', index)">{{ index + 1 }}</button>
                <span v-if="editMode != 'edit'">{{ index + 1 }}</span>
            </div>
            <div v-if="editMode == 'edit'" class="btn-group mt-2">
                <button v-if="canAddRow" class="btn btn-sm btn-outline-primary" @click="emit('insertRowAt', index)"><i class="fas fa-plus"></i></button>
                <button class="btn btn-sm btn-outline-danger" @click="emit('deleteRowAt', index)"><i class="fas fa-times"></i></button>
            </div>
        </td>
        <slot :subVals="modelValue"></slot>
    </tr>
    <tr v-if="editMode == 'edit' && myErrors.length" :colspan="cols.length" class="invalid-feedback d-block">
        <div v-for="msg in myErrors">{{ msg }}</div>
    </tr> 
</template>


<script setup lang="ts">
import type { PropType } from 'vue';
import type { MessageBag, FormValue, CompoundFormValue } from '@/main';
import { ref, toRef, provide } from 'vue';
import { useFormField, spliceMessageBag, coerceToCompoundFormValue, copyCompoundFormValue, symbols } from '@/main';
import { RepeaterTableCol } from '@/lib/repeater';

const props = defineProps({
    index: {
        type: Number,
        required: true,
    },
    subVals: {
        type: Object as PropType<CompoundFormValue>,
        required: true,
    },
    cols: {
        type: Object as PropType<RepeaterTableCol[]>,
        required: true
    },
    canAddRow: {
        type: Boolean,
        default: true,
    }
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
    (e: 'startMove', index: number): void
    (e: 'insertRowAt', index: number): void
    (e: 'deleteRowAt', index: number): void
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

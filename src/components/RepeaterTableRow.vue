<template>
    <div :style="itemStyle(index)" v-pclass="{'repeater-item': true, 'is-moving': index === movingIndex}" :class="{'is-invalid': showRowErrors}">
        <div v-pclass="'repeater-table-cell repeater-item-control'" :rowspan="showRowErrors ? 2: 1">
            <div>
                <button v-if="editable" class="btn" v-pclass="'btn-repeater-move'" @click="emit('startMove', index)">{{ index + 1 }}</button>
                <span v-if="! editable">{{ index + 1 }}</span>
            </div>
            <div v-if="editable" class="btn-group mt-2">
                <button v-if="canAddRow" class="btn btn-sm btn-outline-primary" @click="emit('insertRowAt', index)"><i class="fas fa-plus"></i></button>
                <button class="btn btn-sm btn-outline-danger" @click="emit('deleteRowAt', index)"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <slot :subVals="modelValue"></slot>
        <div v-if="showRowErrors" v-pclass="'repeater-table-item-errors'">
            <div class="invalid-feedback d-block">
                <div v-for="msg in myErrors">{{ msg }}</div>
            </div>
        </div>
        <template v-if="editable && movingIndex != null">
            <div v-if="movingIndex - index >= 0" v-pclass="'repeater-move-target move-before'" @click="emit('completeMoveTo', index)"></div>
            <div v-if="movingIndex - index > 0" v-pclass="'repeater-move-target move-after'" @click="emit('completeMoveTo', index + 1)"></div>
            <div v-if="index - movingIndex > 0" v-pclass="'repeater-move-target move-before'" @click="emit('completeMoveTo', index - 1)"></div>
            <div v-if="index - movingIndex >= 0" v-pclass="'repeater-move-target move-after'" @click="emit('completeMoveTo', index)"></div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import type { MessageBag, FormValue, CompoundFormValue } from '@/main';
import { computed, ref, toRef, provide } from 'vue';
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
    },
    movingIndex: {
        type: Number,
        required: false,
    },
    editable: {
        type: Boolean,
        required: true,
    }
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
    (e: 'startMove', index: number): void
    (e: 'insertRowAt', index: number): void
    (e: 'deleteRowAt', index: number): void
    (e: 'completeMoveTo', index: number): void
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

const showRowErrors = computed((): boolean => {
    return editMode.value == 'edit' && myErrors.value.length > 0;
});

const itemStyle = (index: number) => {
    // TypeScript doesn't know that CSS custom variable names are valid in a Style object
    // So we have to 'trick' the compiler and explicitly cast to StyleValue
    return {'--row-num': ((index * 2) + 2)} as StyleValue;
};

</script>

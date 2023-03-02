<template>
    <div :style="itemStyle(index)" v-pclass="{'repeater-item': true, 'is-moving': index === movingIndex}" :class="{'is-invalid': showRowErrors}">
        <slot v-if="hasIndexCol" name="indexCol" :subVals="modelValue" ></slot>
        <slot :subVals="modelValue"></slot>
        <div v-if="editable" v-pclass="'repeater-table-cell repeater-item-control'">
            <button v-if="canAddRow" class="btn btn-sm btn-primary ms-1" v-pclass="'btn-repeater-insert'" @click="emit('insertRowAt', index)"><i class="fas fa-plus fa-fw"></i></button>
            <button class="btn btn-sm btn-danger ms-1" v-pclass="'btn-repeater-delete'" @click="emit('deleteRowAt', index)"><i class="fas fa-times fa-fw"></i></button>
            <button v-if="movable" class="btn btn-sm ms-1 btn-secondary" v-pclass="'btn-repeater-move'" @click="emit('startMove', index)"><i class="fas fa-arrows-alt fa-fw"></i></button>
        </div>
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
import type { MessageBag, CompoundFormValue } from '@/main';
import { computed, toRef } from 'vue';
import { useFormField, useHasCompoundValue, coerceToCompoundFormValue } from '@/main';
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
    hasIndexCol: {
        type: Boolean,
        default: true,
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
    },
    movable: {
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
    index: toRef(props, 'index'),
};

const { modelValue, errors, myErrors, editMode } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);

useHasCompoundValue(modelValue, errors);

const showRowErrors = computed((): boolean => {
    return editMode.value == 'edit' && myErrors.value.length > 0;
});

const itemStyle = (index: number) => {
    // TypeScript doesn't know that CSS custom variable names are valid in a Style object
    // So we have to 'trick' the compiler and explicitly cast to StyleValue
    return {'--row-num': ((index * 2) + 2)} as StyleValue;
};

</script>

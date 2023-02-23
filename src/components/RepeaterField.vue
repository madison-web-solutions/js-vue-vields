<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-pclass="'repeater'">
                <div v-pclass="{'repeater-item': true, 'is-moving': index === movingIndex}" :style="itemStyle(index)" v-for="(rowVals, index) in modelValue">
                    <div v-pclass="'repeater-item-control'">
                        <div>
                            <button v-if="editable" class="btn" v-pclass="'btn-repeater-move'" @click="startMove(index)">{{ index + 1 }}</button>
                            <span v-if="! editable">{{ index + 1 }}</span>
                        </div>
                        <div v-if="editable" class="btn-group mt-2">
                            <button v-if="canAddRow" class="btn btn-sm btn-outline-primary" @click="insertRowAt(index)"><i class="fas fa-plus"></i></button>
                            <button class="btn btn-sm btn-outline-danger" @click="deleteRowAt(index)"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    <RepeaterRow v-pclass="'repeater-item-content'" :index="index" :subVals="rowVals">
                        <template v-slot="{ subVals }">
                            <slot :index="index" :subVals="subVals"></slot>
                        </template>
                    </RepeaterRow>
                    <template v-if="editable && movingIndex != null">
                        <div v-if="movingIndex - index >= 0" v-pclass="'repeater-move-target move-before'" @click="completeMoveTo(index)"></div>
                        <div v-if="movingIndex - index > 0" v-pclass="'repeater-move-target move-after'" @click="completeMoveTo(index + 1)"></div>
                        <div v-if="index - movingIndex > 0" v-pclass="'repeater-move-target move-before'" @click="completeMoveTo(index - 1)"></div>
                        <div v-if="index - movingIndex >= 0" v-pclass="'repeater-move-target move-after'" @click="completeMoveTo(index)"></div>
                    </template>
                </div>
                <div v-if="editable && canAddRow" v-pclass="'repeater-append'">
                    <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
                </div>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue';
import type { RepeaterFormValue, MessageBag } from '@/main';
import { computed, toRefs } from 'vue';
import { commonProps, useRepeaterField } from '@/main';
import { RepeaterRow } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    appendLabel: {
        type: String,
        default: 'Add Row',
    },
    min: {
        type: Number,
    },
    max: {
        type: Number,
    }
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    modelValue,
    editMode,
    FieldWrapper,
    standardWrapperProps,
    canAddRow,
    appendRow,
    insertRowAt,
    deleteRowAt,
    movingIndex,
    startMove,
    completeMoveTo,
} = useRepeaterField(emit, propRefs, {
    fieldTypeSlug: 'repeater'
});

const editable = computed(() => {
    return (props.disabled !== true) && (editMode.value == 'edit');
});

const itemStyle = (index: number) => {
    // TypeScript doesn't know that CSS custom variable names are valid in a Style object
    // So we have to 'trick' the compiler and explicitly cast to StyleValue
    return {'--row-num': (index + 1)} as StyleValue;
};

</script>

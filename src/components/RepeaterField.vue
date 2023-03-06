<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-pclass="{'repeater': true, 'repeater-vertical-flow': ! horizontalFlow, 'repeater-horizontal-flow': horizontalFlow}" class="row mb-2">
                <div :class="colCssClass" v-for="(rowVals, index) in modelValue">
                    <div v-pclass="{'repeater-item': true, 'is-moving': index === movingIndex}">
                        <div v-pclass="'repeater-item-control'" v-if="editable">
                            <button v-if="canAddRow" class="btn btn-sm btn-primary" v-pclass="'btn-repeater-insert'" @click="insertRowAt(index)"><i class="fas fa-plus fa-fw"></i></button>
                            <button v-if="modelValue.length > 1" class="btn btn-sm btn-secondary" v-pclass="'btn-repeater-move'" @click="startMove(index)"><i class="fas fa-arrows-alt fa-fw"></i></button>
                            <button class="btn btn-sm btn-danger ms-1" v-pclass="'btn-repeater-delete'" @click="deleteRowAt(index)"><i class="fas fa-times fa-fw"></i></button>
                        </div>
                        <RepeaterRow v-pclass="'repeater-item-content'" :index="index">
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
                </div>
            </div>
            <div v-if="editable && canAddRow" v-pclass="'repeater-append'">
                <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
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
    },
    colCssClass: {
        type: String,
        default: 'col-12',
    },
    horizontalFlow: {
        type: Boolean,
        default: false,
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

</script>

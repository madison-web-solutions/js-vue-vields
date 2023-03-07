<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-pclass="{'repeater': true, 'repeater-vertical-flow': ! horizontalFlow, 'repeater-horizontal-flow': horizontalFlow}" class="row mb-2">
                <div :class="colCssClass" v-for="item in loopItems">
                    <div v-pclass="{'repeater-item': true, 'is-moving': item.index === movingIndex}">
                        <div v-pclass="'repeater-item-control'" v-if="editable">
                            <button v-if="canAddRow" class="btn btn-sm btn-primary" v-pclass="'btn-repeater-insert'" @click="item.insertRowBefore"><i class="fas fa-plus fa-fw"></i></button>
                            <button v-if="modelValue.length > 1" class="btn btn-sm btn-secondary" v-pclass="'btn-repeater-move'" @click="item.startMove"><i class="fas fa-arrows-alt fa-fw"></i></button>
                            <button class="btn btn-sm btn-danger ms-1" v-pclass="'btn-repeater-delete'" @click="item.deleteRow"><i class="fas fa-times fa-fw"></i></button>
                        </div>
                        <FieldArrayItem :index="item.index">
                            <div v-pclass="'repeater-item-content'" :class="{'is-invalid': item.showRowErrors}">
                                <FieldGroup>
                                    <slot :index="item.index" :subVals="item.rowVals"></slot>
                                </FieldGroup>
                                <div v-if="item.showRowErrors" class="invalid-feedback d-block">
                                    <div v-for="msg in item.rowErrors">{{ msg }}</div>
                                </div>
                            </div>
                        </FieldArrayItem>
                        <template v-if="editable && movingIndex != null">
                            <div v-pclass="'repeater-move-target move-before'" @click="item.completeMoveBefore"></div>
                            <div v-pclass="'repeater-move-target move-after'" @click="item.completeMoveAfter"></div>
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
import { FieldArrayItem, FieldGroup } from '@/main';

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
    movingIndex,
    loopItems,
} = useRepeaterField(emit, propRefs, {
    fieldTypeSlug: 'repeater'
});

const editable = computed(() => {
    return (props.disabled !== true) && (editMode.value == 'edit');
});

</script>

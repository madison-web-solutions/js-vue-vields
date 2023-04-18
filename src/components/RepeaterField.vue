<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-pclass="'repeater'" class="row mb-2">
                <div v-if="loopItems.length == 0" class="col-12"><!-- bootstrap row must have at least one col to avoid negative margin breaking layout --></div>
                <div :class="colCssClass" v-for="item in loopItems">
                    <div v-pclass="{'repeater-item': true, 'is-moving': item.index === movingIndex}">
                        <div v-pclass="'repeater-item-control'" v-if="editable">
                            <button v-if="canAddRow" class="btn btn-sm btn-primary" v-pclass="'btn-repeater-insert'" @click="item.insertRowBefore"><i class="fas fa-plus fa-fw"></i></button>
                            <button v-if="movable" class="btn btn-sm btn-secondary" v-pclass="'btn-repeater-move'" @click="item.startMove"><i class="fas fa-arrows-alt fa-fw"></i></button>
                            <button class="btn btn-sm btn-danger ms-1" v-pclass="'btn-repeater-delete'" @click="item.deleteRow"><i class="fas fa-times fa-fw"></i></button>
                        </div>
                        <FieldArrayItem :index="item.index">
                            <div v-if="subValuesType == 'compound'" v-pclass="'repeater-item-content'" :class="{'is-invalid': item.showRowErrors}">
                                <FieldGroup>
                                    <slot :index="item.index" :subVals="item.rowVals"></slot>
                                </FieldGroup>
                                <div v-if="item.showRowErrors" class="invalid-feedback d-block">
                                    <div v-for="msg in item.rowErrors">{{ msg }}</div>
                                </div>
                            </div>

                            <div v-if="subValuesType == 'simple'" v-pclass="'repeater-item-content'">
                                <slot :index="item.index" :subVal="item.rowVals"></slot>
                            </div>
                        </FieldArrayItem>
                        <template v-if="editable && isMoving">
                            <div v-pclass="['repeater-move-target', horizontalFlow ? 'repeater-horizontal-flow' : 'repeater-vertical-flow', 'move-before']" @click="item.completeMoveBefore"></div>
                            <div v-pclass="['repeater-move-target', horizontalFlow ? 'repeater-horizontal-flow' : 'repeater-vertical-flow', 'move-after']" @click="item.completeMoveAfter"></div>
                        </template>
                    </div>
                </div>
            </div>
            <slot name="appendRow" :canAddRow="canAddRow">
                <div v-if="editable && canAddRow" v-pclass="'repeater-append'">
                    <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
                </div>
            </slot>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { RepeaterFormValue, MessageBag, Config } from '@/main';
import type { PropType } from 'vue';
import { computed, toRefs, provide } from 'vue';
import { commonProps, useRepeaterField, useExtendsConfig, symbols } from '@/main';
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
    movable: {
        type: Boolean,
        default: true,
    },
    colCssClass: {
        type: String,
        default: 'col-12',
    },
    horizontalFlow: {
        type: Boolean,
        default: false,
    },
    subValuesType: {
        type: String,
        default: 'compound',
    },
    config: {
        type: Object as PropType<Partial<Config>>,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    editMode,
    FieldWrapper,
    standardWrapperProps,
    movable,
    isMoving,
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

provide(symbols.editMode, editMode);
useExtendsConfig(propRefs.config);

</script>

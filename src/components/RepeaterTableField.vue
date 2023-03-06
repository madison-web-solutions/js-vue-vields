<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-pclass="{'repeater-table': true, 'repeater-vertical-flow': true, 'has-index-col': hasIndexCol, 'has-control-col': editable}" :style="repeaterStyle">
                <div v-pclass="'repeater-table-header'">
                    <div v-if="hasIndexCol" v-pclass="'repeater-table-cell'"></div>
                    <div v-for="col in myCols" v-pclass="'repeater-table-cell'">
                        <slot name="th" :col="col">{{ col.label }}</slot>
                    </div>
                    <div v-if="editable" v-pclass="'repeater-table-cell'"></div>
                </div>
                <RepeaterTableRow v-for="(rowVals, index) in modelValue"                     
                    :cols="myCols"
                    :hasIndexCol="hasIndexCol"
                    :index="index"
                    :subVals="rowVals"
                    :movingIndex="movingIndex"
                    :editable="editable"
                    :movable="editable && modelValue.length > 1"
                    @startMove="startMove"
                    @insertRowAt="insertRowAt"
                    @deleteRowAt="deleteRowAt"
                    @completeMoveTo="completeMoveTo"
                >
                    <template #indexCol="{ subVals }">
                        <div v-pclass="'repeater-table-cell repeater-item-index'">
                            <slot name="indexCol" :index="index" :subVals="subVals" >
                                <div>{{ index + 1 }}</div>
                            </slot>
                        </div>
                    </template>
                    <template v-slot="{ subVals }">
                        <div v-for="col in cols" v-pclass="'repeater-table-cell'">
                            <slot :name="col.name" :index="index" :subVals="subVals"></slot>
                        </div>
                    </template>
                </RepeaterTableRow>

                <div v-if="editable && canAddRow" v-pclass="'repeater-append'">
                    <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
                </div>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import type { RepeaterFormValue, MessageBag, RepeaterTableCol, RepeaterTableColOpts } from '@/main';
import { computed, toRefs } from 'vue';
import { commonProps, useRepeaterField, startCase } from '@/main';
import { RepeaterTableRow } from '@/main';

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
    cols: {
        type: Object as PropType<RepeaterTableColOpts[]>,
        required: true,
    },
    hasIndexCol: {
        type: Boolean,
        default: true,
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
    fieldTypeSlug: 'repeater-table'
});

const editable = computed(() => {
    return (props.disabled !== true) && (editMode.value == 'edit');
});

const myCols = computed((): RepeaterTableCol[] => {
    return (propRefs.cols?.value || []).map((col) => {
        return {
            name: col.name,
            label: col.label ? col.label : startCase(col.name),
        };
    });
});

const repeaterStyle = computed(() => {
    // TypeScript doesn't know that CSS custom variable names are valid in a Style object
    // So we have to 'trick' the compiler and explicitly cast to StyleValue
    return {'--num-cols': myCols.value.length} as StyleValue;
});


</script>

<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="repeater-table" :style="repeaterStyle">
                <div class="repeater-table-header">
                    <div v-for="col in myCols">
                        <slot name="th" :col="col">{{ col.label }}</slot>
                    </div>
                </div>
                <RepeaterTableRow v-for="(rowVals, index) in modelValue"
                    :class="{'is-moving': index === movingIndex}"                        
                    :cols="myCols"
                    :index="index"
                    :subVals="rowVals"
                    :movingIndex="movingIndex"
                    @startMove="startMove"
                    @insertRowAt="insertRowAt"
                    @deleteRowAt="deleteRowAt"
                    @completeMoveTo="completeMoveTo"
                >
                    <template v-slot="{ subVals }">
                        <div v-for="col in cols">
                            <slot :name="col.name" :index="index" :subVals="subVals"></slot>
                        </div>
                    </template>
                </RepeaterTableRow>

                <div v-if="editMode == 'edit' && canAddRow" class="repeater-table-append">
                    <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
                </div>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import type { RepeaterFormValue, MessageBag } from '@/main';
import { computed, ref, toRefs, onBeforeUnmount } from 'vue';
import { commonProps, useRepeaterField, spliceMessageBag, startCase, coerceToRepeaterFormValue, copyRepeaterFormValue, coerceToArrayKey, reindexErrors, symbols } from '@/main';
import { RepeaterTableRow, FieldWrapper } from '@/main';
import { RepeaterTableCol, RepeaterTableColOpts } from '@/lib/repeater';

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
    }
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    inputEleId,
    modelValue,
    myErrors,
    editMode,
    canAddRow,
    appendRow,
    insertRowAt,
    deleteRowAt,
    move,
    movingIndex,
    isMoving,
    startMove,
    completeMoveTo,
    cancelMove,
} = useRepeaterField(emit, propRefs);

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

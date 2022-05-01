<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <table class="table repeater-table">
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th v-for="col in myCols">
                            <slot name="th" :col="col">{{ col.label }}</slot>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(rowVals, index) in modelValue">
                        <RepeaterTableRow 
                            class="repeater-item"
                            :class="{'is-moving': index === movingIndex}"
                            :style="itemStyle(index)"
                            :cols="myCols"
                            :index="index"
                            :subVals="rowVals"
                            @startMove="startMove"
                            @insertRowAt="insertRowAt"
                            @deleteRowAt="deleteRowAt"
                        >
                            <template v-slot="{ subVals }">
                                <td v-for="col in cols">
                                    <slot :name="col.name" :index="index" :subVals="subVals"></slot>
                                </td>
                            </template>
                        </RepeaterTableRow>
                            <!--template v-if="editMode == 'edit' && movingIndex != null">
                                <div v-if="movingIndex - index >= 0" class="repeater-move-target move-before" @click="completeMoveTo(index)"></div>
                                <div v-if="movingIndex - index > 0" class="repeater-move-target move-after" @click="completeMoveTo(index + 1)"></div>
                                <div v-if="index - movingIndex > 0" class="repeater-move-target move-before" @click="completeMoveTo(index - 1)"></div>
                                <div v-if="index - movingIndex >= 0" class="repeater-move-target move-after" @click="completeMoveTo(index)"></div>
                            </template-->
                    </template>
                </tbody>
                <tfoot v-if="editMode == 'edit' && canAddRow">
                    <tr>
                        <td :colspan="myCols.length" class="repeater-append">
                            <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
                        </td>
                    </tr>
                </tfoot>
            </table>
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

const itemStyle = (index: number) => {
    // TypeScript doesn't know that CSS custom variable names are valid in a Style object
    // So we have to 'trick' the compiler and explicitly cast to StyleValue
    return {'--row-num': (index + 1)} as StyleValue;
};

</script>

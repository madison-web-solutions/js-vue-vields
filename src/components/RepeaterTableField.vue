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

                <FieldArrayItem v-for="item in loopItems" :index="item.index">
                    <div :style="itemStyle(item.index)" v-pclass="{'repeater-item': true, 'is-moving': item.index === movingIndex}" :class="{'is-invalid': item.showRowErrors}">
                        <div v-if="hasIndexCol" v-pclass="'repeater-table-cell repeater-item-index'">
                            <slot name="indexCol" :index="item.index" :subVals="item.rowVals" >
                                <div>{{ item.index + 1 }}</div>
                            </slot>
                        </div>
                        <FieldGroup>
                            <div v-for="col in cols" v-pclass="'repeater-table-cell'">
                                <slot :name="col.name" :index="item.index" :subVals="item.rowVals"></slot>
                            </div>
                        </FieldGroup>
                        <div v-if="editable" v-pclass="'repeater-table-cell repeater-table-item-control'">
                            <button v-if="canAddRow" class="btn btn-sm btn-primary ms-1" v-pclass="'btn-repeater-insert'" @click="item.insertRowBefore"><i class="fas fa-plus fa-fw"></i></button>
                            <button class="btn btn-sm btn-danger ms-1" v-pclass="'btn-repeater-delete'" @click="item.deleteRow"><i class="fas fa-times fa-fw"></i></button>
                            <button v-if="movable" class="btn btn-sm ms-1 btn-secondary" v-pclass="'btn-repeater-move'" @click="item.startMove"><i class="fas fa-arrows-alt fa-fw"></i></button>
                        </div>
                        <div v-if="item.showRowErrors" v-pclass="'repeater-table-item-errors'">
                            <div class="invalid-feedback d-block">
                                <div v-for="msg in item.rowErrors">{{ msg }}</div>
                            </div>
                        </div>
                        <template v-if="editable && movingIndex != null">
                            <div v-pclass="'repeater-move-target move-before'" @click="item.completeMoveBefore"></div>
                            <div v-pclass="'repeater-move-target move-after'" @click="item.completeMoveAfter"></div>
                        </template>
                    </div>
                </FieldArrayItem>

                <div v-if="editable && canAddRow" v-pclass="'repeater-append'">
                    <button class="btn btn-primary" @click="appendRow"><i class="fas fa-plus"></i> {{ appendLabel }}</button>
                </div>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import type { RepeaterFormValue, MessageBag, RepeaterTableCol, RepeaterTableColOpts, Config } from '@/main';
import { computed, toRefs, provide } from 'vue';
import { commonProps, useRepeaterField, startCase, useExtendsConfig, symbols } from '@/main';
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
    cols: {
        type: Object as PropType<RepeaterTableColOpts[]>,
        required: true,
    },
    hasIndexCol: {
        type: Boolean,
        default: true,
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
    modelValue,
    editMode,
    FieldWrapper,
    standardWrapperProps,
    canAddRow,
    appendRow,
    movingIndex,
    loopItems,
} = useRepeaterField(emit, propRefs, {
    fieldTypeSlug: 'repeater-table'
});

const editable = computed(() => {
    return (props.disabled !== true) && (editMode.value == 'edit');
});

const movable = computed(() => {
    return editable.value && modelValue.value.length > 1;
});

const myCols = computed((): RepeaterTableCol[] => {
    return (propRefs.cols?.value || []).map((col) => {
        return {
            name: col.name,
            label: col.label ? col.label : startCase(col.name),
        };
    });
});

// TypeScript doesn't know that CSS custom variable names are valid in a Style object
// So we have to 'trick' the compiler and explicitly cast to StyleValue
const repeaterStyle = computed(() => {
    return {'--num-cols': myCols.value.length} as StyleValue;
});
const itemStyle = (index: number) => {
    return {'--row-num': ((index * 2) + 2)} as StyleValue;
};

provide(symbols.editMode, editMode);
useExtendsConfig(propRefs.config);

</script>

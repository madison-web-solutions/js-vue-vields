<template>
  <FieldWrapper :field="field">
    <template #input>
      <div :class="{'vfm-repeater-table': true, 'vfm-has-index-col': hasIndexCol, 'vfm-has-control-col': editable}" :style="repeaterStyle">
        <div class="vfm-repeater-table-header">
          <div v-if="hasIndexCol" class="vfm-repeater-table-cell"></div>
          <div v-for="col in myCols" class="vfm-repeater-table-cell">
            <slot name="th" :col="col">{{ col.label }}</slot>
          </div>
          <div v-if="editable" class="vfm-repeater-table-cell"></div>
        </div>

        <FieldArrayItem v-for="item in loopItems" :index="item.index">
          <div :class="{'vfm-repeater-table-item': true, 'vfm-is-moving': item.index === movingIndex, 'is-invalid': item.showRowErrors}" :style="itemStyle(item.index)">
            <div v-if="hasIndexCol" class="vfm-repeater-table-cell vfm-repeater-table-item-index">
              <slot name="indexCol" :index="item.index" :subVals="item.rowVals"><div>{{ item.index + 1 }}</div></slot>
            </div>
            <FieldGroup>
              <div v-for="col in cols" class="vfm-repeater-table-cell vfm-repeater-table-item-content">
                <slot :name="col.name" :index="item.index" :subVals="item.rowVals"></slot>
              </div>
            </FieldGroup>
            <div v-if="editable" class="vfm-repeater-table-cell vfm-repeater-table-item-control">
              <button v-if="canAddRow" class="vfm-btn-repeater-insert btn btn-sm btn-primary ms-1" @click="item.insertRowBefore">
                <Icon icon="plus" />
              </button>
              <button class="vfm-btn-repeater-delete btn btn-sm btn-danger ms-1" @click="item.deleteRow">
                <Icon icon="x"/>
              </button>
              <button v-if="movable" class="vfm-btn-repeater-move btn btn-sm ms-1 btn-secondary" @click="item.startMove">
                <Icon icon="move"/>
              </button>
            </div>
            <div v-if="item.showRowErrors" class="vfm-repeater-table-cell vfm-repeater-table-item-errors">
              <div class="invalid-feedback d-block">
                <div v-for="msg in item.rowErrors">{{ msg }}</div>
              </div>
            </div>
            <template v-if="editable && isMoving">
              <div class="vfm-repeater-table-move-target move-before" @click="item.completeMoveBefore"></div>
              <div class="vfm-repeater-table-move-target move-after" @click="item.completeMoveAfter"></div>
            </template>
          </div>
        </FieldArrayItem>

        <div v-if="editable && canAddRow" class="vfm-repeater-table-append">
          <button class="btn btn-primary" @click="appendRow">
            <Icon icon="plus" /> {{ appendLabel }}
          </button>
        </div>
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { StyleValue } from "vue";
import type { FieldProps, FormValue, RepeaterFormValue, MessageBag, RepeaterTableCol, RepeaterTableColOpts, Config, Loose, RepeaterFieldProps} from "../types";
import { computed, toRefs } from "vue";
import useRepeaterField from "../lib/useRepeaterField";
import useExtendsConfig from "../lib/useExtendsConfig";
import { startCase } from "../lib/utils";
import FieldArrayItem from "./FieldArrayItem.vue";
import FieldGroup from "./FieldGroup.vue";
import Icon from "./Icon.vue";


const props = withDefaults(defineProps<FieldProps & RepeaterFieldProps & {
  cols: RepeaterTableColOpts[],
  appendLabel?: string,
  hasIndexCol?: boolean,
  config?: Loose<Config>,
}>(), {
  appendLabel: "Add Row",
  movable: true,
  hasIndexCol: true,
});

const slots = defineSlots<
  {
    th: (props: { col: RepeaterTableCol }) => any;
    indexCol: (props: { index: number; subVals: FormValue }) => any;
  } & Record<string, (props: { index: number; subVals: FormValue }) => any>
>();

const emit = defineEmits<{
  (e: "update:modelValue", value: RepeaterFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const {
  field,
  FieldWrapper,
  movable,
  isMoving,
  canAddRow,
  appendRow,
  movingIndex,
  loopItems,
} = useRepeaterField(emit, propRefs);

const editable = computed(() => {
  return props.disabled !== true && field.value.editMode == "edit";
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
  return { "--num-cols": myCols.value.length } as StyleValue;
});
const itemStyle = (index: number) => {
  return { "--row-num": index * 2 + 2 } as StyleValue;
};

useExtendsConfig(propRefs.config);
</script>

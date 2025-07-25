<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="vfm-repeater row mb-2">
        <div v-if="loopItems.length == 0" class="col-12">
          <!-- bootstrap row must have at least one col to avoid negative margin breaking layout -->
        </div>
        <div :class="colCssClass" v-for="item in loopItems">
          <div :class="{'vfm-repeater-item': true, 'vfm-is-moving': item.index === movingIndex}">
            <div class="vfm-repeater-item-control" v-if="editable">
              <button v-if="canAddRow" class="vfm-btn-repeater-insert btn btn-sm btn-primary" @click="item.insertRowBefore">
                <Icon icon="plus"/>
              </button>
              <button v-if="movable" class="vfm-btn-repeater-move btn btn-sm btn-secondary" @click="item.startMove">
                <Icon icon="move"/>
              </button>
              <button class="vfm-btn-repeater-delete btn btn-sm btn-danger ms-1" @click="item.deleteRow">
                <Icon icon="x"/>
              </button>
            </div>
            <FieldArrayItem :index="item.index">
              <div v-if="subValuesType == 'simple'" class="vfm-repeater-item-content">
                <slot
                  :index="item.index"
                  :subVal="item.rowVals"
                  :subVals="null"
                ></slot>
              </div>
              <div v-if="subValuesType == 'compound'" :class="{'vfm-repeater-item-content': true, 'is-invalid': item.showRowErrors}">
                <FieldGroup>
                  <slot
                    :index="item.index"
                    :subVal="null"
                    :subVals="item.rowVals"
                  ></slot>
                </FieldGroup>
                <div v-if="item.showRowErrors" class="invalid-feedback d-block">
                  <div v-for="msg in item.rowErrors">{{ msg }}</div>
                </div>
              </div>
            </FieldArrayItem>
            <template v-if="editable && isMoving">
              <div :class="['vfm-repeater-move-target', horizontalFlow ? 'vfm-repeater-horizontal-flow' : 'repeater-vertical-flow', 'vfm-move-before']" @click="item.completeMoveBefore"></div>
              <div :class="['vfm-repeater-move-target', horizontalFlow ? 'vfm-repeater-horizontal-flow' : 'vfm-repeater-vertical-flow', 'vfm-move-after']" @click="item.completeMoveAfter"></div>
            </template>
          </div>
        </div>
      </div>
      <slot name="appendRow" :canAddRow="canAddRow">
        <div v-if="editable && canAddRow" class="vfm-repeater-append">
          <button class="btn btn-primary" @click="appendRow">
            <Icon icon="plus" /> {{ appendLabel }}
          </button>
        </div>
      </slot>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { RepeaterFormValue, MessageBag, Config, Loose, FormValue, FieldProps, RepeaterFieldProps } from "../types";
import { computed, toRefs } from "vue";
import useRepeaterField from "../lib/useRepeaterField";
import useExtendsConfig from "../lib/useExtendsConfig";
import FieldGroup from "./FieldGroup.vue";
import FieldArrayItem from "./FieldArrayItem.vue";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<FieldProps & RepeaterFieldProps & {
  appendLabel?: string,
  colCssClass?: string,
  horizontalFlow?: boolean,
  subValuesType?: 'simple' | 'compound',
  config?: Loose<Config>
}>(), {
  appendLabel: 'Add Row',
  colCssClass: 'col-12',
  subValuesType: 'compound',
});

const emit = defineEmits<{
  (e: "update:modelValue", value: RepeaterFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const slots = defineSlots<{
  default: (props: {
    index: number;
    subVal: FormValue | null;
    subVals: FormValue | null;
  }) => any;
  appendRow: (props: { canAddRow: boolean }) => any;
}>();

const propRefs = toRefs(props);

useExtendsConfig(propRefs.config);

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

</script>

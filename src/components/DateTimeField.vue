<template>
  <FieldWrapper :field="field">
    <template #input>
      <input
        :id="field.inputEleId"
        :name="field.pathString"
        type="hidden"
        :value="modelValue"
        data-testid="value-input"
      />
      <div class="input-group">
        <DateField
          v-model="dateValue"
          :errors="errors"
          :disabled="field.disabled"
          :min="minDateYmd"
          :max="maxDateYmd"
          ref="firstField"
        />
        <TimeField
          v-model="timeValue"
          :errors="errors"
          :disabled="field.disabled"
          :min="minTimeHis"
          :max="maxTimeHis"
        />
      </div>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
/*
 * ModelValue is a string representation of a DateTime
 */
import type { FieldEmitType, FieldProps } from "../types";
import { computed, toRefs, provide, ref, watch } from "vue";
import EmptyFieldWrapper from "./EmptyFieldWrapper.vue";
import DateField from "./DateField.vue";
import TimeField from "./TimeField.vue";
import injectionSymbols from "../lib/injection-symbols";
import useFormField from "../lib/useFormField";
import { ymdHisToFormat } from "date-format-ms";

const props = defineProps<FieldProps & {
  displayFormat?: string,
  min?: string,
  max?: string,
}>();

const displayFormat = computed(() => props.displayFormat ?? 'd/m/Y H:i');

const emit = defineEmits<FieldEmitType<string | null>>();

const propRefs = toRefs(props);

const coerceFn = (value: any): string | null => {
  return value == null || value === "" ? null : String(value);
};

const { modelValue, errors, field, FieldWrapper } = useFormField<string | null>(coerceFn, emit, propRefs);

provide(injectionSymbols.fieldWrapperComponent, EmptyFieldWrapper);

const displayValue = computed(() => {
  return ymdHisToFormat(modelValue.value, displayFormat.value) || modelValue.value;
});

const dateValue = ref<string | undefined>(undefined);
const timeValue = ref<string | undefined>(undefined);

const updateLocalVals = (newVal: string | null) => {
  const parts = newVal?.split(" ") || [];
  if (parts.length === 0) {
    dateValue.value = undefined;
    timeValue.value = undefined;
  } else if (parts.length === 1) {
    if (parts[0].match(":")) {
      dateValue.value = undefined;
      timeValue.value = parts[0];
    } else {
      dateValue.value = parts[0];
      timeValue.value = undefined;
    }
  } else {
    dateValue.value = parts[0];
    timeValue.value = parts[1];
  }
};
updateLocalVals(modelValue.value);
watch(modelValue, updateLocalVals);

watch([dateValue, timeValue], ([newDate, newTime]) => {
  if (newDate && newTime) {
    modelValue.value = newDate + " " + newTime;
  }
  if (!newDate && !newTime) {
    modelValue.value = null;
  }
});

const minDateYmd = computed((): string | undefined => {
  return ymdHisToFormat(props.min, "Y-m-d") || undefined;
});

const maxDateYmd = computed((): string | undefined => {
  return ymdHisToFormat(props.max, "Y-m-d") || undefined;
});

const minTimeHis = computed((): string | undefined => {
  if (props.min && dateValue.value && dateValue.value == minDateYmd.value) {
    return ymdHisToFormat(props.min, "H:i:s") || undefined;
  }
});

const maxTimeHis = computed((): string | undefined => {
  if (props.max && dateValue.value && dateValue.value == maxDateYmd.value) {
    return ymdHisToFormat(props.max, "H:i:s") || undefined;
  }
});

//const firstField = ref<InstanceType<typeof DateField> | null>(null);
//const focus = () => firstField.value?.focus();
//defineExpose({ focus });
</script>

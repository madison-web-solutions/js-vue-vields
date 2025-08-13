<template>
  <FieldWrapper :field="field">
    <template #input>
      <input
        :id="field.inputEleId"
        :name="field.pathString"
        type="hidden"
        :value="modelValue"
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
import type { FieldProps, MessageBag } from "../types";
import { computed, toRefs, provide } from "vue";
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

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): string | null => {
  return value == null ? "" : String(value);
};

const { modelValue, errors, field, FieldWrapper } = useFormField<string | null>(coerceFn, emit, propRefs);

provide(injectionSymbols.fieldWrapperComponent, EmptyFieldWrapper);

const displayValue = computed(() => {
  return ymdHisToFormat(modelValue.value, displayFormat.value) || modelValue.value;
});

const modelValueParts = computed(
  (): [string | undefined, string | undefined] => {
    const parts = modelValue.value?.split(" ") || [];
    if (parts.length == 0) {
      return [undefined, undefined];
    } else if (parts.length == 1) {
      // try to work out whether it's a date or a time
      if (parts[0].match(":")) {
        return [undefined, parts[0]];
      } else {
        return [parts[0], undefined];
      }
    } else {
      return [parts[0], parts[1]];
    }
  },
);

const dateValue = computed({
  get: (): string | undefined => {
    return modelValueParts.value[0];
  },
  set: (newVal: string | undefined) => {
    modelValue.value = [newVal, timeValue.value]
      .filter((part) => !!part)
      .join(" ");
  },
});

const timeValue = computed({
  get: (): string | undefined => {
    return modelValueParts.value[1];
  },
  set: (newVal: string | undefined) => {
    modelValue.value = [dateValue.value, newVal]
      .filter((part) => !!part)
      .join(" ");
  },
});

const minDateYmd = computed((): string | undefined => {
  return ymdHisToFormat(props.min, "Y-m-d") || undefined;
});

const maxDateYmd = computed((): string | undefined => {
  return ymdHisToFormat(props.max, "Y-m-d") || undefined;
});

const minTimeHis = computed((): string | undefined => {
  if (props.min && dateValue.value && dateValue.value == minDateYmd.value) {
    return ymdHisToFormat(props.min, "H-i-s") || undefined;
  }
});

const maxTimeHis = computed((): string | undefined => {
  if (props.max && dateValue.value && dateValue.value == maxDateYmd.value) {
    return ymdHisToFormat(props.max, "H-i-s") || undefined;
  }
});

//const firstField = ref<InstanceType<typeof DateField> | null>(null);
//const focus = () => firstField.value?.focus();
//defineExpose({ focus });
</script>

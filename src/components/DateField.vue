<template>
  <FieldWrapper :field="field">
    <template #input>
      <input
        :id="field.inputEleId"
        :name="field.pathString"
        ref="inputEle"
        type="date"
        class="form-control"
        :class="{ 'is-invalid': field.hasError }"
        :disabled="field.disabled"
        :autocomplete="field.autocomplete"
        :placeholder="myPlaceholder"
        :value="modelValue"
        :min="minDateYmd"
        :max="maxDateYmd"
        @change="onChange"
        @keydown.enter="onEnterKey"
        @keydown.tab="onEnterPress"
        @blur="onBlur"
      />
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, EnterPressEmitType, FieldProps } from "../types";
import { computed, ref, toRefs } from "vue";
import useFormField from "../lib/useFormField";
import { getConfigRef } from "../lib/config";
import { dateToUtcFormat, ymdToFormat } from "date-format-ms";

const props = defineProps<FieldProps & {
  displayFormat?: string | undefined,
  min?: string | undefined,
  max?: string | undefined,
}>();

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<FieldEmitType<string | null> & EnterPressEmitType>();

const propRefs = toRefs(props);

const displayFormat = getConfigRef("date.displayFormat", propRefs.displayFormat);

const coerceFn = (value: any): string | null => {
  return ymdToFormat(String(value), "Y-m-d") || null;
};

const { modelValue, field, FieldWrapper, focus } = useFormField<string | null>(coerceFn, emit, propRefs);

const todayUtc: Date = ((): Date => {
  const now: Date = new Date();
  const tsUtc: number = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return new Date(tsUtc);
})();

const minDateUtc = computed((): Date | undefined => {
  if (props.min === "today") {
    return todayUtc;
  }
  return utcYmdToDate(props.min) || undefined;
});
const maxDateUtc = computed((): Date | undefined => {
  if (props.max === "today") {
    return todayUtc;
  }
  return utcYmdToDate(props.max) || undefined;
});

const minDateYmd = computed((): string | undefined => {
  return minDateUtc.value
    ? dateToUtcFormat(minDateUtc.value, "Y-m-d")
    : undefined;
});
const maxDateYmd = computed((): string | undefined => {
  return maxDateUtc.value
    ? dateToUtcFormat(maxDateUtc.value, "Y-m-d")
    : undefined;
});

const clampValue = (date: Date): Date => {
  if (minDateUtc.value != null && date < minDateUtc.value) {
    date = minDateUtc.value;
  }
  if (maxDateUtc.value != null && date > maxDateUtc.value) {
    date = maxDateUtc.value;
  }
  return date;
};

const utcYmdToDate = function (ymd: unknown): Date | null {
  if (typeof ymd == "string") {
    const match = /^(\d\d\d\d)-(\d\d)-(\d\d)/.exec(ymd.replace(/\s/g, ""));
    if (match) {
      const year = parseInt(match[1], 10);
      const monthIndex = parseInt(match[2], 10) - 1;
      const dayOfMonth = parseInt(match[3], 10);
      const d = new Date(Date.UTC(year, monthIndex, dayOfMonth, 0, 0, 0, 0));
      d.setUTCFullYear(year);
      return d;
    }
  }
  return null;
};

const updateFromInput = (clamped: boolean) => {
  const inputValue: string = inputEle.value?.value || "";
  let newDate = utcYmdToDate(inputValue);
  if (newDate == null) {
    modelValue.value = null;
  } else {
    if (clamped !== false) {
      newDate = clampValue(newDate);
    }
    modelValue.value = dateToUtcFormat(newDate, "Y-m-d");
  }
};

const onChange = () => {
  // Don't clamp while the user is typing
  updateFromInput(false);
};
const onEnterPress = () => {
  updateFromInput(true);
};
const onEnterKey = () => {
  onEnterPress();
  emit("enterPress");
};
const onBlur = () => {
  updateFromInput(true);
};

const myPlaceholder = computed((): string => {
  return field.value.placeholder ?? "dd/mm/yyyy";
});

const displayValue = computed((): string => {
  return ymdToFormat(modelValue.value, displayFormat.value) ?? "";
});

defineExpose({ focus });

</script>

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
          :withSeconds="true"
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
 * ModelValue is a timestamp in _milliseconds_ (number)
 */
import type { FieldEmitType, FieldProps } from "../types";
import { computed, toRefs, provide, ref, watch } from "vue";
import EmptyFieldWrapper from "./EmptyFieldWrapper.vue";
import DateField from "./DateField.vue";
import TimeField from "./TimeField.vue";
import injectionSymbols from "../lib/injection-symbols";
import useFormField from "../lib/useFormField";
import { coerceToNumber } from "../lib/type-utils";
import { localYmdHisToDate, utcYmdHisToDate, dateToLocalFormat, dateToUtcFormat } from "date-format-ms";
import { timeFormat, timeSplit } from "../lib/time";

const props = defineProps<FieldProps & {
  displayFormat?: string,
  // Only 'local' and 'utc' are supported because those are the only choices for extracting values from a JS Date object
  timeZone?: 'local' | 'utc',
  min?: number,
  max?: number,
}>();

const displayFormat = computed(() => props.displayFormat ?? 'd/m/Y H:i');
const timeZone = computed(() => props.timeZone ?? 'local');

const emit = defineEmits<FieldEmitType<number | null>>();

const propRefs = toRefs(props);

const tsToFormat = (ts: number, format: string): string|null => {
  const date = new Date(ts);
  const formatWithoutTimezone = (timeZone.value == 'local' ? dateToLocalFormat : dateToUtcFormat)(date, format);
  // We will support a few timezone codes that aren't supported in date-format-ms yet
  // e - Timezone identifier	Examples: UTC, GMT, Atlantic/Azores
  // P	Difference to Greenwich time (GMT) with colon between hours and minutes	Example: +02:00
  // p	The same as P, but returns Z instead of +00:00 (available as of PHP 8.0.0)	Examples: Z or +02:00
  // Z	Timezone offset in seconds. The offset for timezones west of UTC is always negative, and for those east of UTC is always positive.	-43200 through 50400
  return formatWithoutTimezone.replace(/(?<!\\)(e|P|p|Z)/g, (code: string): string => {
      if (timeZone.value == 'local') {
        if (code == 'e') {
          // Gives a value like Europe/London
          return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        const offsetSecs = -date.getTimezoneOffset() * 60;
        const sign = offsetSecs < 0 ? -1 : 1;
        const [hours, mins] = timeSplit(sign * offsetSecs);
        switch (code) {
          case 'P':
            return (sign < 0 ? '-' : '+') + timeFormat(hours, mins);
          case 'p':
            if (offsetSecs == 0) {
              return 'Z';
            } else {
              return (sign < 0 ? '-' : '+') + timeFormat(hours, mins);
            }
          case 'Z':
            return String(offsetSecs);
          default:
            return code;
        }
      } else {
        switch (code) {
          case 'e':
            return 'UTC';
          case 'P':
            return '+00:00';
          case 'p':
            return 'Z';
          case 'Z':
            return '0';
          default:
            return code;
        }
      }
    });
};

// Used to interpret the incoming date/time from the DateField and TimeField
const ymdHisToDate = (ymdHis: string): Date|null => {
  return (timeZone.value == 'local' ? localYmdHisToDate : utcYmdHisToDate)(ymdHis);
};

const { modelValue, errors, field, FieldWrapper } = useFormField<number | null>(coerceToNumber, emit, propRefs);

provide(injectionSymbols.fieldWrapperComponent, EmptyFieldWrapper);

const displayValue = computed((): string => {
  if (modelValue.value == null) {
    return "";
  }
  const formatted = tsToFormat(modelValue.value, displayFormat.value);
  return formatted == null ? "" : formatted;
});

const dateValue = ref<string | undefined>(undefined);
const timeValue = ref<string | undefined>(undefined);

// Set dateValue and timeValue from the modelValue timestamp (and update when modelValue changes)
const updateLocalVals = (newTs: number | null) => {
  if (newTs == null) {
    dateValue.value = undefined;
    timeValue.value = undefined;
  } else {
    const dateYmd = tsToFormat(newTs, "Y-m-d");
    dateValue.value = dateYmd ? dateYmd : undefined;
    const timeHis = tsToFormat(newTs, "H:i:s");
    timeValue.value = timeHis ? timeHis : undefined;
  }
};
updateLocalVals(modelValue.value);
watch(modelValue, updateLocalVals);

// Set modelValue when dateValue or timeValue changes
watch([dateValue, timeValue], ([newDate, newTime]) => {
  if (newDate && newTime) {
    // If both are set, update modelValue to the new timestamp
    const date = ymdHisToDate(newDate + " " + newTime);
    if (date) {
      modelValue.value = date.getTime();
    }
  }
  if (!newDate && !newTime) {
    // If both are cleared, unset modelValue
    modelValue.value = null;
  }
});

const minDateYmd = computed((): string | undefined => {
  return props.min == null ? undefined : (tsToFormat(props.min, "Y-m-d") ?? undefined);
});

const maxDateYmd = computed((): string | undefined => {
  return props.max == null ? undefined : (tsToFormat(props.max, "Y-m-d") ?? undefined);
});

const minTimeHis = computed((): string | undefined => {
  if (props.min && dateValue.value && dateValue.value == minDateYmd.value) {
    return tsToFormat(props.min, "H:i:s") || undefined;
  }
});

const maxTimeHis = computed((): string | undefined => {
  if (props.max && dateValue.value && dateValue.value == maxDateYmd.value) {
    return tsToFormat(props.max, "H:i:s") || undefined;
  }
});

//const firstField = ref<InstanceType<typeof DateField> | null>(null);
//const focus = () => firstField.value?.focus();
//defineExpose({ focus });
</script>

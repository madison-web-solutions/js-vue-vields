<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <input
        :id="inputEleId"
        :name="pathString"
        type="hidden"
        :value="modelValue"
      />
      <div class="input-group">
        <DateField
          v-model="dateValue"
          :errors="errors"
          :disabled="disabled"
          :min="minDateYmd"
          :max="maxDateYmd"
          ref="firstField"
        />
        <TimeField
          v-model="timeValue"
          :errors="errors"
          :withSeconds="true"
          :disabled="disabled"
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
import type { MessageBag } from "../main";
import { computed, toRefs, provide, ref, watch, PropType } from "vue";
import {
  symbols,
  commonProps,
  coerceToNumber,
  useFormField,
  DateField,
  TimeField,
  EmptyFieldWrapper,
} from "../main";
import { localYmdHisToDate, utcYmdHisToDate, dateToLocalFormat, dateToUtcFormat } from "date-format-ms";
import { timeFormat, timeSplit } from "../lib/time";

const props = defineProps(
  Object.assign({}, commonProps, {
    displayFormat: {
      type: String,
      default: "d/m/Y H:i:s",
    },
    // Only 'local' and 'utc' are supported because those are the only choices for extracting values from a JS Date object
    timeZone: {
      type: String as PropType<'local'|'utc'>,
      default: 'local',
    },
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
  }),
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number | undefined): void;
  (e: "update:errors", value: MessageBag): void;
}>();

provide(symbols.fieldWrapperComponent, EmptyFieldWrapper);

const propRefs = toRefs(props);

const tsToFormat = (ts: number, format: string): string|null => {
  const date = new Date(ts);
  const formatWithoutTimezone = (props.timeZone == 'local' ? dateToLocalFormat : dateToUtcFormat)(date, format);
  // We will support a few timezone codes that aren't supported in date-format-ms yet
  // e - Timezone identifier	Examples: UTC, GMT, Atlantic/Azores
  // P	Difference to Greenwich time (GMT) with colon between hours and minutes	Example: +02:00
  // p	The same as P, but returns Z instead of +00:00 (available as of PHP 8.0.0)	Examples: Z or +02:00
  // Z	Timezone offset in seconds. The offset for timezones west of UTC is always negative, and for those east of UTC is always positive.	-43200 through 50400
  return formatWithoutTimezone.replace(/(?<!\\)(e|P|p|Z)/g, (code: string): string => {
      if (props.timeZone == 'local') {
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
  return (props.timeZone == 'local' ? localYmdHisToDate : utcYmdHisToDate)(ymdHis);
};

const {
  inputEleId,
  pathString,
  modelValue,
  errors,
  FieldWrapper,
  standardWrapperProps,
} = useFormField<number | undefined>(coerceToNumber, emit, propRefs, {
  fieldTypeSlug: "timestamp",
});

const displayValue = computed((): string => {
  if (modelValue.value == null) {
    return "";
  }
  const formatted = tsToFormat(modelValue.value, props.displayFormat);
  return formatted == null ? "" : formatted;
});

const dateValue = ref<string | undefined>(undefined);
const timeValue = ref<string | undefined>(undefined);

// Set dateVale and timeValue from the modelValue timestamp (and update when modelValue changes)
const updateLocalVals = (newTs: number | undefined) => {
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
    modelValue.value = undefined;
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
    return tsToFormat(props.min, "H-i-s") || undefined;
  }
});

const maxTimeHis = computed((): string | undefined => {
  if (props.max && dateValue.value && dateValue.value == maxDateYmd.value) {
    return tsToFormat(props.max, "H-i-s") || undefined;
  }
});

const firstField = ref<InstanceType<typeof DateField> | null>(null);
const focus = () => firstField.value?.focus();
defineExpose({ focus });
</script>

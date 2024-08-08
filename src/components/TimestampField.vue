<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <input :id="inputEleId" :name="pathString" type="hidden" :value="modelValue" />
            <div class="input-group">
                <DateField v-model="dateValue" :errors="errors" :disabled="disabled" :min="minDateYmd" :max="maxDateYmd" />
                <TimeField v-model="timeValue" :errors="errors" :withSeconds="true" :disabled="disabled" :min="minTimeHis" :max="maxTimeHis" />
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '../main';
import { computed, toRefs, provide, ref, watch } from 'vue';
import { symbols, commonProps, coerceToNumber, useFormField, DateField, TimeField, EmptyFieldWrapper } from '../main';
import { tsToLocalFormat, localYmdHisToDate } from 'date-format-ms';

const props = defineProps(Object.assign({}, commonProps, {
    displayFormat: {
        type: String,
        default: 'd/m/Y H:i:s',
    },
    min: {
        type: Number,
    },
    max: {
        type: Number,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

provide(symbols.fieldWrapperComponent, EmptyFieldWrapper);

const propRefs = toRefs(props);

const { inputEleId, pathString, modelValue, errors, FieldWrapper, standardWrapperProps } = useFormField<number | undefined>(coerceToNumber, emit, propRefs, {
    fieldTypeSlug: 'timestamp'
});

const displayValue = computed((): string => {
    if (modelValue.value == null) {
        return '';
    }
    const formatted = tsToLocalFormat(modelValue.value, props.displayFormat);
    return (formatted == null ? '' : formatted);
});

const dateValue = ref<string | undefined>(undefined);
const timeValue = ref<string | undefined>(undefined);

// Set dateVale and timeValue from the modelValue timestamp (and update when modelValue changes)
const updateLocalVals = (newTs: number | undefined) => {
    if (newTs == null) {
        dateValue.value = undefined;
        timeValue.value = undefined;
    } else {
        const dateYmd = tsToLocalFormat(newTs, 'Y-m-d');
        dateValue.value = (dateYmd ? dateYmd : undefined);
        const timeHis = tsToLocalFormat(newTs, 'H:i:s');
        timeValue.value = (timeHis ? timeHis : undefined);
    }
};
updateLocalVals(modelValue.value);
watch(modelValue, updateLocalVals);

// Set modelValue when dateValue or timeValue changes
watch([dateValue, timeValue], ([newDate, newTime]) => {
    if (newDate && newTime) {
        // If both are set, update modelValue to the new timestamp
        const date = localYmdHisToDate(newDate + ' ' + newTime);
        if (date) {
            modelValue.value = date.getTime();
        }
    }
    if (! newDate && ! newTime) {
        // If both are cleared, unset modelValue
        modelValue.value = undefined;
    }
});

const minDateYmd = computed((): string | undefined => {
    return tsToLocalFormat(props.min, 'Y-m-d') || undefined;
});

const maxDateYmd = computed((): string | undefined => {
    return tsToLocalFormat(props.max, 'Y-m-d') || undefined;
});

const minTimeHis = computed((): string | undefined => {
    if (props.min && dateValue.value && dateValue.value == minDateYmd.value) {
        return tsToLocalFormat(props.min, 'H-i-s') || undefined;
    }
});

const maxTimeHis = computed((): string | undefined => {
    if (props.max && dateValue.value && dateValue.value == maxDateYmd.value) {
        return tsToLocalFormat(props.max, 'H-i-s') || undefined;
    }
});

// @todo expose this?
// const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

</script>
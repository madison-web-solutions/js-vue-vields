<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <input :id="inputEleId" :name="pathString" type="hidden" :value="modelValue" />
            <div class="input-group">
                <DateField v-model="dateValue" :errors="errors" :disabled="disabled" :min="minDateYmd" :max="maxDateYmd" />
                <TimeField v-model="timeValue" :errors="errors" :disabled="disabled" :min="minTimeHis" :max="maxTimeHis" />
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '../main';
import { computed, toRefs, provide } from 'vue';
import { symbols, commonProps, useFormField, DateField, TimeField, EmptyFieldWrapper } from '../main';
import { ymdHisToFormat } from 'date-format-ms';

const props = defineProps(Object.assign({}, commonProps, {
    displayFormat: {
        type: String,
        default: 'd/m/Y H:i',
    },
    min: {
        type: String,
    },
    max: {
        type: String,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

provide(symbols.fieldWrapperComponent, EmptyFieldWrapper);

const propRefs = toRefs(props);

const coerceFn = (value: any): string | undefined => {
    return (value == null ? '' : String(value));
};

const { inputEleId, pathString, modelValue, errors, FieldWrapper, standardWrapperProps } = useFormField<string | undefined>(coerceFn, emit, propRefs, {
    fieldTypeSlug: 'date-time'
});

const displayValue = computed(() => {
    return ymdHisToFormat(modelValue.value, props.displayFormat) || modelValue.value;
});

const modelValueParts = computed((): [string | undefined, string | undefined] => {
    const parts = modelValue.value?.split(' ') || [];
    if (parts.length == 0) {
        return [undefined, undefined];
    } else if (parts.length == 1) {
        // try to work out whether it's a date or a time
        if (parts[0].match(':')) {
            return [undefined, parts[0]];
        } else {
            return [parts[0], undefined];
        }
    } else {
        return [parts[0], parts[1]];
    }
});

const dateValue = computed({
    get:(): string | undefined => {
        return modelValueParts.value[0];
    },
    set: (newVal: string | undefined) => {
        modelValue.value = [newVal, timeValue.value].filter(part => !!part).join(' ');
    }
});

const timeValue = computed({
    get:(): string | undefined => {
        return modelValueParts.value[1];
    },
    set: (newVal: string | undefined) => {
        modelValue.value = [dateValue.value, newVal].filter(part => !!part).join(' ');
    }
});

const minDateYmd = computed((): string | undefined => {
    return ymdHisToFormat(props.min, 'Y-m-d') || undefined;
});

const maxDateYmd = computed((): string | undefined => {
    return ymdHisToFormat(props.max, 'Y-m-d') || undefined;
});

const minTimeHis = computed((): string | undefined => {
    if (props.min && dateValue.value && dateValue.value == minDateYmd.value) {
        return ymdHisToFormat(props.min, 'H-i-s') || undefined;
    }
});

const maxTimeHis = computed((): string | undefined => {
    if (props.max && dateValue.value && dateValue.value == maxDateYmd.value) {
        return ymdHisToFormat(props.max, 'H-i-s') || undefined;
    }
});

</script>
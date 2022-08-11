<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <input :id="inputEleId" :name="pathString" ref="inputEle" type="date" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="myPlaceholder" :value="modelValue" @change="onChange" @keydown.enter="onEnterPress" @blur="onBlur" />
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { computed, ref, toRefs } from 'vue';
import { commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';
import { dateToUtcFormat, ymdToFormat } from 'date-format-ms';

const props = defineProps(Object.assign({}, commonProps, {
    displayFormat: {
        type: String,
        default: 'd/m/Y',
    },
    min: {
        type: String,
    },
    max: {
        type: String,
    },
}));

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): string | undefined => {
    return ymdToFormat(String(value), 'Y-m-d') || undefined;
};

const { inputEleId, pathString, modelValue, myErrors, hasError } = useFormField<string | undefined>(coerceFn, emit, propRefs);

const todayUtc: Date = ((): Date => {
    const now: Date = new Date();
    const tsUtc: number = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return new Date(tsUtc);
})();

const minDateUtc = computed((): Date | undefined => {
    if (props.min === 'today') {
        return todayUtc;
    }
    return utcYmdToDate(props.min) || undefined;
});
const maxDateUtc = computed((): Date | undefined => {
    if (props.max === 'today') {
        return todayUtc;
    }
    return utcYmdToDate(props.max) || undefined;
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
    if (typeof ymd == 'string') {
        const match = /^(\d\d\d\d)-(\d\d)-(\d\d)/.exec(ymd.replace(/\s/g, ''));
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
    const inputValue: string = inputEle.value?.value || '';
    let newDate = utcYmdToDate(inputValue);
    if (newDate == null) {
        modelValue.value = undefined;
    } else {
        if (clamped !== false) {
            newDate = clampValue(newDate);
        }
        modelValue.value = dateToUtcFormat(newDate, 'Y-m-d');
    }
};

const onChange = () => {
    // Don't clamp while the user is typing
    updateFromInput(false);
};
const onEnterPress = () => {
    updateFromInput(true);
};
const onBlur = () => {
    updateFromInput(true);
};


const myPlaceholder = computed((): string => {
    return props.placeholder || 'dd/mm/yyyy';
});

const displayValue = computed((): string => {
    return ymdToFormat(modelValue.value, props.displayFormat) || '';
});

</script>

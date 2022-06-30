<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <input ref="inputEle" :id="inputEleId" type="text" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="placeholder" :value="displayValue" @change="change" @focus="onFocus" @blur="onBlur" />
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, ParsesTextFieldOptions } from '@/main';
import { computed, ref, toRefs } from 'vue';
import { commonProps, useFormField, useParsesTextField } from '@/main';
import { timeParse, timeFormat, timeSplit } from '@/lib/time';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    withSeconds: {
        type: Boolean,
        default: false
    },
    max: {
        type: String,
        required: false,
    },
    min: {
        type: String,
        required: false,
    },
    step: {
        type: String,
        required: false,
    },
}));

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): string | undefined => {
    return (value == null || value === '') ? undefined : String(value);
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<string | undefined>(coerceFn, emit, propRefs);

const stepSeconds = computed((): number | undefined => {
    return props.step == null ? undefined : timeParse(props.step);
});
const minSeconds = computed((): number | undefined => {
    return props.min == null ? undefined : timeParse(props.min);
});
const maxSeconds = computed((): number | undefined => {
    return props.max == null ? undefined : timeParse(props.max);
});

const parsesTextFieldOptions: ParsesTextFieldOptions<string> = {
    coerceNotEmpty: (val: string): string | undefined => {
        const secsSinceMidnight: number | undefined = timeParse(val);
        if (secsSinceMidnight == null) {
            return undefined;
        }
        const [hours, mins, secs] = timeSplit(secsSinceMidnight);
        return timeFormat(hours, mins, props.withSeconds ? secs : undefined);
    },
    clamp: (val: string): string => {
        let secsSinceMidnight: number | undefined = timeParse(val);
        if (secsSinceMidnight == null) {
            return val;
        }
        if (stepSeconds.value != null) {
            secsSinceMidnight = Math.round(secsSinceMidnight / stepSeconds.value) * stepSeconds.value;
        }
        if (minSeconds.value != null) {
            secsSinceMidnight = Math.max(secsSinceMidnight, minSeconds.value);
        }
        if (maxSeconds.value != null) {
            secsSinceMidnight = Math.min(secsSinceMidnight, maxSeconds.value);
        }
        const [hours, mins, secs] = timeSplit(secsSinceMidnight);
        return timeFormat(hours, mins, props.withSeconds ? secs : undefined);
    },
};

const { onFocus, onBlur, change, displayValue } = useParsesTextField<string>(modelValue, inputEle, parsesTextFieldOptions);

</script>
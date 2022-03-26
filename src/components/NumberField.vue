<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <input ref="inputEle" :id="inputEleId" type="text" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="placeholder" :value="displayValue" @change="change" @focus="onFocus" @blur="onBlur" />
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { computed, ref, toRefs } from 'vue';
import { getUniqueKey, commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    max: {
        type: Number,
    },
    min: {
        type: Number,
    },
    integersOnly: {
        type: Boolean,
        default: false,
    },
    decimals: {
        type: Number,
    },
    step: {
        type: Number,
    },
    customDisplayValue: {
        type: String,
    }
}));

const inputEle = ref<HTMLInputElement | null>(null);

const inputEleId = ref(getUniqueKey());

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceToNumber = (value: unknown): number | undefined => {
    switch (typeof value) {
        case 'number':
            return value;
        case 'string':
            const num = parseFloat(value);
            return isNaN(num) ? undefined : num;
    }
    return undefined;
};

const { modelValue, myErrors, hasError } = useFormField<number | undefined>(coerceToNumber, emit, propRefs);

const focused = ref<boolean>(false);
const onFocus = () => {
    focused.value = true;
};
const onBlur = () => {
    focused.value = false;
};

const modelValueIfNumber = computed((): number | undefined => {
    if (typeof(modelValue.value) == 'number' && isFinite(modelValue.value)) {
        return modelValue.value;
    } else {
        return undefined;
    }
});

const myStep = computed((): number | undefined => {
    if (props.step == null) {
        if (props.integersOnly) {
            return 1;
        } else {
            if (props.decimals == null) {
                return undefined
            } else {
                return Math.pow(10, -props.decimals);
            }
        }
    } else {
        return props.step;
    }
});

const displayValue = computed((): string => {
    if (tempClear.value) {
        return '';
    }
    if (props.customDisplayValue != null) {
        return props.customDisplayValue;
    }
    if (modelValueIfNumber.value != null) {
        return modelValueIfNumber.value.toLocaleString(undefined, localeStringOpts.value);
    } else if (modelValue.value == null) {
        return '';
    } else {
        return String(modelValue.value);
    }
});

const localeStringOpts = computed((): Intl.NumberFormatOptions => {
    let opts: Intl.NumberFormatOptions = {};
    if (props.step == null && props.decimals != null) {
        opts.minimumFractionDigits = props.decimals;
    }
    if (props.step != null && props.step < 1) {
        opts.maximumFractionDigits = Math.log10(props.step);
    }
    return opts;
});

const clampValue = (num: number) => {
    if (myStep.value != null) {
        num = Math.round(num / myStep.value) * myStep.value;
    }
    if (props.min != null) {
        num = Math.max(num, props.min);
    }
    if (props.max != null) {
        num = Math.min(num, props.max);
    }
    // This last step is to try and avoid float rounding errors
    // For example, if the value is 1.131 and the step size is 0.01, you might think that we'd be able to round it to 1.13 as follows:
    // Math.round((1.131) / 0.01) * 0.01
    // But that actually yields 1.1300000000000001 because of rounding errors in the float representation of 0.01
    num = (num.toFixed(12) as any) * 1;
    return num;
};

const tempClear = ref<boolean>(false);

const updateAfterClearing = (value: any) => {
    tempClear.value = true;
    modelValue.value = value;
    tempClear.value = false;
};

const change = () => {
    if (props.disabled || inputEle.value == null) {
        return;
    }
    const inputTextValue: string = inputEle.value.value.replace(/\s/g, '');
    if (inputTextValue == '') {
        // No value
        updateAfterClearing(null);
    } else {
        const num: number = parseFloat(inputTextValue);
        if (isFinite(num)) {
            // It is a number at least - so now we can deal with max/min/step
            updateAfterClearing(clampValue(num));
        } else {
            // Not a number
            updateAfterClearing(undefined);
        }
    }
};

</script>

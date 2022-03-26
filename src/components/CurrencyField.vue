<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="input-group">
                <span v-if="showCurrency" class="input-group-text">{{ currencyCode }}</span>
                <input ref="inputEle" :id="inputEleId" type="text" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="placeholder" :value="displayValue" @change="change" @focus="onFocus" @blur="onBlur" />
            </div>
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
    currencyCode: {
        type: String,
        required: true,
    },
    max: {
        type: Number,
    },
    min: {
        type: Number,
    },
    step: {
        type: Number,
    },
    showCurrency: {
        type: Boolean,
        default: false,
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

const numberFormatter = computed((): Intl.NumberFormat => {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: props.currencyCode,
    });
});

const exponent = computed((): number => {
    return numberFormatter.value.resolvedOptions().maximumFractionDigits;
});

const amountInPence = computed((): number | undefined => {
    if (typeof(modelValue.value) == 'number' && isFinite(modelValue.value)) {
        return modelValue.value;
    } else {
        return undefined;
    }
});

const amountInPounds = computed((): number | undefined => {
    if (amountInPence.value == null) {
        return undefined;
    } else {
        return amountInPence.value / Math.pow(10, exponent.value);
    }
});

const displayValue = computed((): string => {
    if (tempClear.value || modelValue.value == null) {
        return '';
    }
    if (amountInPounds.value == null) {
        return String(modelValue.value);
    }
    if (focused.value) {
        return String(amountInPounds.value);
    } else {
        return numberFormatter.value.format(amountInPounds.value);
    }
});

const tempClear = ref<boolean>(false);

const updateAfterClearing = (value: any) => {
    tempClear.value = true;
    modelValue.value = value;
    tempClear.value = false;
};

const clampValue = (amountInPence: number) => {
    if (props.step != null) {
        amountInPence = Math.round(amountInPence / props.step) * props.step;
    }
    if (props.min != null) {
        amountInPence = Math.max(amountInPence, props.min);
    }
    if (props.max != null) {
        amountInPence = Math.min(amountInPence, props.max);
    }
    return Math.round(amountInPence);
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
        const newAmountInPounds: number = parseFloat(inputTextValue);
        if (isFinite(newAmountInPounds)) {
            // It is a number at least - so now we can deal with max/min/step
            let newAmountInPence = newAmountInPounds * Math.pow(10, exponent.value);
            newAmountInPence = clampValue(newAmountInPence);
            updateAfterClearing(newAmountInPence
            );
        } else {
            // Not a number
            updateAfterClearing(undefined);
        }
    }
};

</script>

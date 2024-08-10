<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div class="input-group">
                <span v-if="showCurrency" class="input-group-text">{{ currencyCode }}</span>
                <input ref="inputEle" :id="inputEleId" :name="pathString" type="text" class="form-control text-end" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="placeholder" :value="displayValue" @change="change" @focus="onFocus" @blur="onBlur" />
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, ParsesTextFieldOptions } from '../main';
import { computed, ref, toRefs } from 'vue';
import { commonProps, useFormField, useParsesTextField, getConfigRef } from '../main';

const props = defineProps(Object.assign({}, commonProps, {
    currencyCode: {
        type: String,
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
        default: null,
    }
}));

const inputEle = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const showCurrency = getConfigRef('currency.showCurrency', propRefs.showCurrency);

const currencyCode = getConfigRef('currency.currencyCode', propRefs.currencyCode);

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

const { inputEleId, pathString, modelValue, hasError, FieldWrapper, standardWrapperProps, focus } = useFormField<number | undefined>(coerceToNumber, emit, propRefs, {
    fieldTypeSlug: 'currency'
});

const numberFormatter = computed((): Intl.NumberFormat => {
    if (currencyCode.value) {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode.value,
        });
    } else {
        return new Intl.NumberFormat(undefined, {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
});

const exponent = computed((): number => {
    return numberFormatter.value.resolvedOptions().maximumFractionDigits ?? 2;
});

const parsesTextFieldOptions: ParsesTextFieldOptions<number> = {
    coerceNotEmpty: (textInput: string): number | undefined => {
        textInput = textInput.replace(/^[^-0-9]+/,'');
        const amountInMajorUnits = parseFloat(textInput);
        if (! isFinite(amountInMajorUnits)) {
            return undefined;
        }
        return amountInMajorUnits * Math.pow(10, exponent.value);
    },
    clamp: (amountInMinorUnits: number): number => {
        if (props.step != null) {
            amountInMinorUnits = Math.round(amountInMinorUnits / props.step) * props.step;
        }
        if (props.min != null) {
            amountInMinorUnits = Math.max(amountInMinorUnits, props.min);
        }
        if (props.max != null) {
            amountInMinorUnits = Math.min(amountInMinorUnits, props.max);
        }
        return Math.round(amountInMinorUnits);
    },
    formatForReading: (amountInMinorUnits: number): string => {
        const amountInMajorUnits = amountInMinorUnits / Math.pow(10, exponent.value);
        return numberFormatter.value.format(amountInMajorUnits);
    },
    formatForEditing: (amountInMinorUnits: number): string => {
        const amountInMajorUnits = amountInMinorUnits / Math.pow(10, exponent.value);
        return String(amountInMajorUnits);
    }
};

const { onFocus, onBlur, change, displayValue } = useParsesTextField<number>(modelValue, inputEle, parsesTextFieldOptions);

defineExpose({ focus });

</script>

<template>
    <slot></slot>
</template>

<script setup lang="ts">
import type { MessageBag, FormValue, FixedLens } from '../main';
import { toRef, provide, inject } from 'vue';
import { useExtendsPath, symbols } from '../main';

const props = defineProps<{
    index: number,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: FormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const slots = defineSlots<{
    default: (props: {}) => any,
}>();

const index = toRef(props, 'index');

useExtendsPath(index);

const parentValueLens = inject(symbols.valueLens, undefined);

const valueLens: FixedLens<FormValue> = {
    lensType: 'fixed',
    get: (): FormValue => {
        if (parentValueLens && parentValueLens.lensType == 'indexed') {
            return parentValueLens.get(index.value);
        } else {
            return undefined;
        }
    },
    set: (newVal: FormValue) => {
        if (parentValueLens && parentValueLens.lensType == 'indexed') {
            parentValueLens.set(index.value, newVal);
        }
    },
};

provide(symbols.valueLens, valueLens);

const parentErrorsLens = inject(symbols.errorsLens, undefined);

const errorsLens: FixedLens<MessageBag> = {
    lensType: 'fixed',
    get: (): MessageBag => {
        if (parentErrorsLens && parentErrorsLens.lensType == 'indexed') {
            return parentErrorsLens.get(index.value);
        } else {
            return {};
        }
    },
    set: (newErrors: MessageBag) => {
        if (parentErrorsLens && parentErrorsLens.lensType == 'indexed') {
            parentErrorsLens.set(index.value, newErrors);
        }
    }
};

provide(symbols.errorsLens, errorsLens);

</script>

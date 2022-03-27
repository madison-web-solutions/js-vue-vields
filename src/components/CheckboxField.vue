<template>
    <FieldWrapper :inputEleId="inputEleId" :label="inlineLabel ? undefined : label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" :id="inputEleId" v-model="modelValue" :class="{'is-invalid': hasError}" :disabled="disabled">
                <label v-if="label && inlineLabel" class="form-check-label" :for="inputEleId">{{ label }}</label>
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { computed, ref, toRefs } from 'vue';
import { commonProps, useFormField, coerceToBoolean } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    inlineLabel: {
        type: Boolean,
        default: false,
    },
    trueLabel: {
        type: String,
        default: 'Yes',
    },
    falseLabel: {
        type: String,
        default: 'No',
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): boolean => {
    return coerceToBoolean(value) === true;
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<boolean>(coerceFn, emit, propRefs);

const displayValue = computed((): string => {
    if (modelValue.value === true) {
        return props.trueLabel;
    } else {
        return props.falseLabel;
    }
});

</script>

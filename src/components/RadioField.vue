<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div v-for="choice in choicesNormalized" class="form-check">
                <input class="form-check-input" :class="{'is-invalid': hasError}" type="radio" :id="inputEleId + String(choice.key)" :checked="modelValue === choice.key" :disabled="disabled" @change="change(choice)">
                <label class="form-check-label" :for="inputEleId + String(choice.key)">{{ choice.label }}</label>
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { Choosable, MessageBag } from '@/main';
import { computed, toRefs } from 'vue';
import { commonProps, useFormField, useHasChoicesSingle } from '@/main';
import { FieldWrapper } from '@/main';

type IdType = string | number | undefined;

const props = defineProps(Object.assign({}, commonProps, {
    directory: {
        type: String,
    },
    choices: {
        type: [String, Object, Array],
    },
    extraParams: {
        type: Object,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: IdType): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): IdType => {
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
            return value;
    }
    return undefined;
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<IdType>(coerceFn, emit, propRefs);

const { choicesNormalized, currentChoice } = useHasChoicesSingle(modelValue, propRefs);

const nullLabel = computed(() => {
    return props.placeholder || '';
});

const change = (newChoice: Choosable) => {
    if (props.disabled) {return;}
    modelValue.value = newChoice.key;
};

const displayValue = computed((): string => {
    if (currentChoice.value) {
        return currentChoice.value.label;
    } else if (modelValue.value == null) {
        return nullLabel.value;
    } else {
        return String(modelValue.value);
    }
});

</script>

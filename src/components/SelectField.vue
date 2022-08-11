<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <select class="form-select" :class="{'is-invalid': hasError}" :id="inputEleId" :name="pathString" :disabled="disabled" @change="change">
                <option ref="nullOption" :disabled="required" :selected="nullSelected">{{ nullLabel }}</option>
                <option v-for="choice in choicesNormalized" :selected="modelValue === choice.key">{{ choice.label }}</option>
            </select>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
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

const { inputEleId, pathString, modelValue, myErrors, hasError } = useFormField<IdType>(coerceFn, emit, propRefs);

const { choicesNormalized, currentChoice, nullSelected } = useHasChoicesSingle(modelValue, propRefs);

const nullLabel = computed(() => {
    return props.placeholder || (props.required ? 'Select' : '');
});

const change = (e: Event) => {
    if (props.disabled) {return;}
    const target = e.target as HTMLSelectElement;
    var index = target.selectedIndex;
    if (index === 0) {
        modelValue.value = undefined;
    } else {
        modelValue.value = choicesNormalized.value[index - 1].key;
    }
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

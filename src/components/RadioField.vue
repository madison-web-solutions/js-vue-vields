<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div v-for="choice in choices" class="form-check">
                <input class="form-check-input" :class="{'is-invalid': hasError}" type="radio" :id="inputEleId + String(choice.key)" :checked="modelValue === choice.key" :disabled="disabled" @change="change(choice)">
                <label class="form-check-label" :for="inputEleId + String(choice.key)">{{ choice.label }}</label>
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { ChoiceList, Choosable, MessageBag } from '@/main';
import { computed, ref, toRefs, watchEffect, inject, onBeforeUnmount } from 'vue';
import { commonProps, useFormField, symbols } from '@/main';
import { FieldWrapper } from '@/main';

type IdType = string | number | undefined;

const props = defineProps(Object.assign({}, commonProps, {
    directory: {
        type: String,
        required: true,
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

const provider = inject(symbols.choiceListProvider);

const choices = ref<ChoiceList>([]);

watchEffect(() => {
    if (props.directory != null && provider != null && provider.value != null) {
        provider.value.get(props.directory, props.extraParams).then((choiceListResult) => {
            choices.value = choiceListResult || [];
        });
    }
});

const currentChoice = computed((): Choosable | null => {
    for (const choice of choices.value) {
        if (choice.key == modelValue.value) {
            return choice;
        }
    }
    return null;
});

const possibleValues = computed((): (string | number)[] => {
    return choices.value.map(choice => choice.key);
});

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

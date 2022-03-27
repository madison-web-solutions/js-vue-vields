<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <select class="form-select" :class="{'is-invalid': hasError}" :id="inputEleId" :disabled="disabled" @change="change">
                <option ref="nullOption" :disabled="required" :selected="nullSelected">{{ nullLabel }}</option>
                <option v-for="choice in choicesNormalized" :selected="modelValue === choice.key">{{ choice.label }}</option>
            </select>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { ChoiceList, Choosable, MessageBag } from '@/main';
import { computed, ref, toRefs, watchEffect, inject, onBeforeUnmount } from 'vue';
import { commonProps, useFormField, symbols } from '@/main';
import { FieldWrapper } from '@/main';
import { startCase } from '@/lib/util';

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

const provider = inject(symbols.choiceListProvider, undefined);

const directoryChoices = ref<ChoiceList>([]);

watchEffect(() => {
    if (props.directory != null) {
        if (provider != null && provider.value != null) {
            provider.value.get(props.directory, props.extraParams).then((choiceListResult) => {
                directoryChoices.value = choiceListResult || [];
            });
        } else {
            console.log("Warning, directory " + props.directory + " specified in field but there is no choice list provider");
            directoryChoices.value = [];
        }
    }
});

const isPartialChoosable = (obj: any): obj is {key: string, label?: unknown} => {
    return typeof obj == 'object' && obj != null && 'key' in obj && typeof obj.key == 'string';
};

const choicesNormalized = computed((): ChoiceList => {
    if (props.directory != null) {
        // Directory is specified, so use the set of choices from the provider
        return directoryChoices.value;
    }
    // Directory is not specified, so the set of choices should be specified as a prop instead
    const out: ChoiceList = [];
    if (props.choices == null) {
        // No options
    } else if (Array.isArray(props.choices)) {
        for (const choice of props.choices) {
            if (typeof choice == 'string') {
                out.push({key: choice, label: startCase(choice)});
            } else if (isPartialChoosable(choice)) {
                out.push({
                    key: choice.key,
                    label: ((typeof choice.label == 'string') ? choice.label : startCase(choice.key))
                });
            } else {
                console.log(props.choices);
                throw "Invalid choice specification";
            }
        }
    } else if (typeof props.choices == 'object') {
        // Assume object keys are option values and object values are option labels
        for (const [key, label] of Object.entries(props.choices)) {
            out.push({
                key: String(key),
                label: String(label)
            });
        }
    } else if (typeof props.choices == 'string') {
        props.choices.split(',').forEach((key) => {
            out.push({key: key.trim(), label: startCase(key)});
        });
    }
    return out;
});

const currentChoice = computed((): Choosable | null => {
    for (const choice of choicesNormalized.value) {
        if (choice.key == modelValue.value) {
            return choice;
        }
    }
    return null;
});

const possibleValues = computed((): (string | number)[] => {
    return choicesNormalized.value.map(choice => choice.key);
});

const nullSelected = computed(() => {
    return modelValue.value == null || possibleValues.value.includes(modelValue.value);
});

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

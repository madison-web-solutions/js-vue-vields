<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-pclass="'custom-select'" ref="container">
                <div class="form-select" @click="toggleDropdown">
                    <slot v-if="currentChoice" :choice="currentChoice">{{ currentChoice.label }}</slot>
                    <slot v-if="nullSelected" name="nullSelected">{{ placeholder || nbsp }}</slot>
                </div>
                <div v-if="showDropdown" v-pclass="'custom-select-items'">
                    <div v-if="nullSelected || ! required" v-pclass="'custom-select-item'" @click="selectNull()">
                        <slot name="nullOption"><span class="text-muted">{{ noValueLabel }}</span></slot>
                    </div>
                    <div v-for="choice in choicesNormalized" v-pclass="'custom-select-item'" @click="selectOption(choice)">
                        <slot :choice="choice">{{ choice.label }}</slot>
                    </div>
                </div>
            </div>
        </template>
        <template #viewMode>
            <template>{{ displayValue }}</template>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, Choosable } from '../main';
import { computed, onMounted, onBeforeUnmount, ref, toRefs, inject } from 'vue';
import { commonProps, useFormField, useHasChoicesSingle, symbols } from '../main';

type IdType = string | number | undefined;

const nbsp = '\xa0';

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

const slots = defineSlots<{
    default: (props: {choice: Choosable}) => any,
    nullSelected: (props: {}) => any,
    nullOption: (props: {}) => any,
}>();

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

const { modelValue, FieldWrapper, standardWrapperProps } = useFormField<IdType>(coerceFn, emit, propRefs, {
    fieldTypeSlug: 'custom-select'
});

const { choicesNormalized, currentChoice, nullSelected } = useHasChoicesSingle(modelValue, propRefs);

const showDropdown = ref(false);

const openDropdown = () => {
    showDropdown.value = true;
};

const closeDropdown = () => {
    showDropdown.value = false;
};

const toggleDropdown = () => {
    showDropdown.value ? closeDropdown() : openDropdown();
};

// Close the dropdown if the user has clicked on the page outside of it
const container = ref<HTMLElement | null>(null);
const maybeCloseDropdown = (e: MouseEvent) => {
    if (showDropdown.value) {
        const target = e.target as Element;
        if (document.body.contains(target) && container.value != null && container.value !== target && ! container.value.contains(target)) {
            closeDropdown();
        }
    }
};
onMounted(() => document.addEventListener('click', maybeCloseDropdown));
onBeforeUnmount(() => document.removeEventListener('click', maybeCloseDropdown));

const selectNull = () => {
    modelValue.value = undefined;
    closeDropdown();
};

const selectOption = (choice: Choosable) => {
    modelValue.value = choice.key;
    closeDropdown();
};

const noValueLabel = inject(symbols.noValueLabel, ref('(None)'));

const displayValue = computed((): string => {
    if (currentChoice.value) {
        return currentChoice.value.label;
    } else {
        return String(modelValue.value);
    }
});

</script>

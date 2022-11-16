<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="dropdown" ref="container">
                <div class="input-group" @click="toggleDropdown">
                    <div class="form-control">
                        <slot v-if="currentChoice" :choice="currentChoice">{{ currentChoice.label }}</slot>
                        <slot v-if="nullSelected" name="nullSelected">{{ placeholder }}</slot>
                    </div>
                    <button class="btn btn-outline-primary dropdown-toggle" type="button"></button>
                </div>
                <ul class="dropdown-menu" :class="showDropdown ? 'show' : ''">
                    <li v-if="nullSelected || ! required">
                        <button type="button" class="dropdown-item" @click="selectNull()">
                            <slot name="nullOption"><span class="text-muted">(None)</span></slot>
                        </button>
                    </li>
                    <li v-for="choice in choicesNormalized">
                        <button type="button" class="dropdown-item" @click="selectOption(choice)">
                            <slot :choice="choice">{{ choice.label }}</slot>
                        </button>
                    </li>
                </ul>
            </div>
        </template>
        <template #viewMode>
            <template v-if="modelValue != null">{{ displayValue }}</template>
            <span v-if="modelValue == null" class="text-muted">(None)</span>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, Choosable } from '@/main';
import { computed, onMounted, onBeforeUnmount, ref, toRefs } from 'vue';
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

const displayValue = computed((): string => {
    if (currentChoice.value) {
        return currentChoice.value.label;
    } else {
        return String(modelValue.value);
    }
});

</script>

<template>
    <RepeaterField
        :label="label"
        :required="required"
        :disabled="disabled"
        :help="help"
        :placeholder="placeholder"
        :errors="errors"
        :name="name"
        appendLabel="Add Section"
        @update:model-value="(newValue) => emit('update:modelValue', newValue)"
        @update:errors="(newErrors) => emit('update:errors', newErrors)"
    >
        <template v-slot="{ index, subVals }">
            <SelectField label="Content Type" name="content_type" :choices="sectionChoices" :required="true" class="mb-3" />
            <template v-if="isValidSection(subVals.content_type)">
                <slot :name="subVals.content_type" :index="index" :subVals="subVals"></slot>
            </template>
        </template>
    </RepeaterField>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { ChoiceList, MessageBag, RepeaterFormValue } from '@/main';
import { commonProps } from '@/main';
import { RepeaterField } from '@/main';
import SelectField from './SelectField.vue';

const props = defineProps(Object.assign({}, commonProps, {
    sectionChoices: {
        type: Object as PropType<ChoiceList>,
        default: [],
    }
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: RepeaterFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const isValidSection = (value: unknown): boolean => {
    for (const choice of props.sectionChoices) {
        if (choice.key === value) {
            return true;
        }
    }
    return false;
};

</script>
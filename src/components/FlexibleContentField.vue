<template>
    <RepeaterField
        :modelValue="modelValue"
        :errors="errors"
        :label="label"
        :required="required"
        :disabled="disabled"
        :help="help"
        :placeholder="placeholder"
        :name="name"
        :fieldTypeSlug="fieldTypeSlug"
        appendLabel="Add Section"
        @update:model-value="(newValue) => emit('update:modelValue', newValue)"
        @update:errors="(newErrors) => emit('update:errors', newErrors)"
    >
        <template v-slot="{ index, subVals }">
            <SelectField label="Content Type" name="content_type" :choices="sectionChoices" :required="true" class="mb-3" />
            <template v-if="isValidSection(subVals?.content_type)">
                <slot :name="subVals.content_type" :index="index" :subVals="subVals"></slot>
            </template>
        </template>
    </RepeaterField>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { Choosable, MessageBag, RepeaterFormValue } from '@/main';
import { computed } from 'vue';
import { commonProps } from '@/main';
import { RepeaterField } from '@/main';
import SelectField from './SelectField.vue';

const props = defineProps(Object.assign({}, commonProps, {
    sectionChoices: {
        type: Object as PropType<Choosable[]>,
        default: [],
    }
}));

const fieldTypeSlug = computed((): string | undefined => {
    return props?.fieldTypeSlug || 'flexible-content';
});

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

<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <input :id="inputEleId" :type="inputType" :name="pathString" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="placeholder" :maxlength="max" v-model="modelValue" @keydown.enter="emit('enterPress')" />
            <span v-if="showRemainingChars" class="position-absolute bottom-0 end-0 p-1 small text-muted">{{ remainingChars }}</span>
        </template>
        <template #viewMode>{{ modelValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { toRefs } from 'vue';
import { commonProps, useFormField, useHasMaxChars } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    inputType: {
        type: String,
        default: 'text',
    },
    max: {
        type: Number,
        required: false,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'update:errors', value: MessageBag): void
    (e: 'enterPress'): void
}>();

const propRefs = toRefs(props);

const coerceToString = (value: any): string => {
    return value ? String(value) : '';
};

const { inputEleId, pathString, modelValue, hasError, FieldWrapper, standardWrapperProps } = useFormField<string>(coerceToString, emit, propRefs);

const { remainingChars, showRemainingChars } = useHasMaxChars(modelValue, propRefs);

</script>

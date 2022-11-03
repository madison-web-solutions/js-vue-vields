<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <textarea :id="inputEleId" :name="pathString" type="text" class="form-control" :class="{'is-invalid': hasError}" :rows="rows" :disabled="disabled" :placeholder="placeholder" v-model="modelValue"></textarea>
            <span v-if="showRemainingChars" class="position-absolute bottom-0 end-0 p-1 small text-muted">{{ remainingChars }}</span>
        </template>
        <template #viewMode>{{ modelValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { ref, toRefs } from 'vue';
import { commonProps, useFormField, useHasMaxChars } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    rows: {
        type: Number,
        default: 5,
    },
    max: {
        type: Number,
        required: false,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceToString = (value: any): string => {
    return value ? String(value) : '';
};

const { inputEleId, pathString, modelValue, myErrors, hasError } = useFormField<string>(coerceToString, emit, propRefs);

const { remainingChars, showRemainingChars } = useHasMaxChars(modelValue, propRefs);

</script>

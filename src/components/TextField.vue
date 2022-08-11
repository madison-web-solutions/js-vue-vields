<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <input :id="inputEleId" :type="inputType" :name="pathString" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" :placeholder="placeholder" v-model="modelValue" @keydown.enter="emit('enterPress')" />
        </template>
        <template #viewMode>{{ modelValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { ref, toRefs } from 'vue';
import { commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    inputType: {
        type: String,
        default: 'text',
    }
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

const { inputEleId, pathString, modelValue, myErrors, hasError } = useFormField<string>(coerceToString, emit, propRefs);

</script>

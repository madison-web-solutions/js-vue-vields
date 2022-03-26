<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <textarea :id="inputEleId" type="text" class="form-control" :class="{'is-invalid': hasError}" :rows="rows" :disabled="disabled" :placeholder="placeholder" v-model="modelValue"></textarea>
        </template>
        <template #viewMode>{{ modelValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { ref, toRefs } from 'vue';
import { getUniqueKey, commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    rows: {
        type: Number,
        default: 5,
    }
}));

const inputEleId = ref(getUniqueKey());

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceToString = (value: any): string => {
    return value ? String(value) : '';
};

const { modelValue, myErrors, hasError } = useFormField<string>(coerceToString, emit, propRefs);

</script>

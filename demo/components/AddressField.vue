<template>
    <CompoundField v-bind="fieldProps" v-model="modelValue" v-model:errors="errors" class="col-12">
        <div class="card">
            <div class="card-body">
                <div class="row gy-2 gx-3">
                    <TextField name="add1" label="Line 1" :required="required" class="col-12" />
                    <TextField name="add2" label="Line 2" :required="false" class="col-12" />
                    <TextField name="city" label="City" :required="required" class="col-md-6" />
                    <TextField name="county" label="County" :required="false" class="col-md-6" />
                    <TextField name="postcode" label="Postcode" :required="required" class="col-md-6" />
                    <CountryField name="country" label="Country" :required="required" class="col-md-6" />
                </div>
            </div>
        </div>
    </CompoundField>
</template>

<script setup lang="ts">
import type { MessageBag, CompoundFormValue } from '@/main';
import { computed, ref } from 'vue';
import { commonProps, coerceToCompoundFormValue } from '@/main';
import { CompoundField, TextField } from '@/main';
import CountryField from './CountryField.vue';

const props = defineProps(commonProps);

const fieldProps = computed(() => {
    return {
        label: props.label,
        required: props.required,
        disabled: props.disabled,
        help: props.help,
        placeholder: props.placeholder,
        name: props.name,
        fieldTypeSlug: 'address',
    };
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: CompoundFormValue): void
    (e: 'update:errors', value: MessageBag): void
}>();

const modelValue = computed({
    get: (): CompoundFormValue => coerceToCompoundFormValue(props.modelValue),
    set: (newValue: CompoundFormValue) => emit('update:modelValue', newValue)
});

const errors = computed({
    get: (): MessageBag => props.errors || {},
    set: (newErrors: MessageBag) => emit('update:errors', newErrors)
});

</script>
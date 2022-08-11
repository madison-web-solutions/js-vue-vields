<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div v-for="choice in choicesNormalized" :key="choice.key">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" :id="inputEleId + choice.key" :name="pathString + '.' + choice.key" :checked="subValues[choice.key]" @change="toggle(choice.key)" :class="{'is-invalid': hasSubErrors[choice.key]}" :disabled="disabled">
                    <label class="form-check-label" :for="inputEleId + choice.key">{{ choice.label }}</label>
                </div>
                <div v-if="hasSubErrors[choice.key]" class="invalid-feedback d-block">
                    <div class="error" v-for="msg in subErrors[choice.key]">{{ msg }}</div>
                </div>
            </div>
        </template>
        <template #viewMode>
            <div v-for="choice in choicesNormalized" :key="choice.key">
                {{ choice.label }}: {{ subValues[choice.key] ? trueLabel : falseLabel }}
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, KeysList } from '@/main';
import { toRefs } from 'vue';
import { commonProps, useFormField, useHasChoicesMultiple } from '@/main';
import { FieldWrapper } from '@/main';

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
    trueLabel: {
        type: String,
        default: 'Yes',
    },
    falseLabel: {
        type: String,
        default: 'No',
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: KeysList): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): KeysList => {
    const out: KeysList = [];
    if (Array.isArray(value)) {
        return value.map((key) => {
            switch (typeof key) {
                case 'string':
                case 'number':
                    return key;
                default:
                    return String(key);
            }
        });
    }
    return out;
};

const { inputEleId, pathString, modelValue, myErrors, errors } = useFormField<KeysList>(coerceFn, emit, propRefs);

const { choicesNormalized, possibleValues, subValues, toggle, subErrors, hasSubErrors } = useHasChoicesMultiple(modelValue, errors, propRefs);

</script>

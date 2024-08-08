<template>
    <FieldWrapper v-bind="standardWrapperProps" :inputWrapperCssClass="inline ? 'd-flex flex-wrap' : ''">
        <template #input>
            <div v-for="choice in choicesNormalized" :key="choice.key" :class="inline ? 'me-3' : ''">
                <div class="form-check" v-pclass="{'checked': isOn(choice.key)}">
                    <input class="form-check-input" type="checkbox" :id="inputEleId + choice.key" :name="pathString + '.' + choice.key" :checked="isOn(choice.key)" @change="toggle(choice.key)" :class="{'is-invalid': hasSubErrors(choice.key)}" :disabled="disabled">
                    <label class="form-check-label" :for="inputEleId + choice.key">{{ choice.label }}</label>
                </div>
                <div v-if="hasSubErrors(choice.key)" class="invalid-feedback d-block">
                    <div class="error" v-for="msg in subErrors[choice.key]">{{ msg }}</div>
                </div>
            </div>
        </template>
        <template #viewMode>
            <div v-for="choice in choicesNormalized" :key="choice.key">
                {{ choice.label }}: {{ isOn(choice.key) ? trueLabel : falseLabel }}
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { MessageBag, KeysList, BooleansMap } from '../main';
import { toRefs } from 'vue';
import { commonProps, useFormFieldWithChoicesMultiple } from '../main';

const props = defineProps(Object.assign({}, commonProps, {
    directory: {
        type: String,
    },
    choices: {
        type: [String, Object, Array],
    },
    inline: {
        type: Boolean,
        default: false,
    },
    valueIs: {
        type: String as PropType<"array" | "object">,
        default: 'array',
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
    (e: 'update:modelValue', value: (KeysList | BooleansMap)): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const {
    choicesNormalized,
    inputEleId,
    pathString,
    FieldWrapper,
    standardWrapperProps,
    toggle,
    isOn,
    subErrors,
    hasSubErrors,
} = useFormFieldWithChoicesMultiple(emit, propRefs, {
    fieldTypeSlug: 'checkboxes'
});

</script>

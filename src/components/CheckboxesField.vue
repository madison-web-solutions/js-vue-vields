<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div v-for="choice in choices" :key="choice.key">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" :id="inputEleId + choice.key" :checked="subValues[choice.key]" @change="toggle(choice.key)" :class="{'is-invalid': hasSubErrors[choice.key]}" :disabled="disabled">
                    <label class="form-check-label" :for="inputEleId + choice.key">{{ choice.label }}</label>
                </div>
                <div v-if="hasSubErrors[choice.key]" class="invalid-feedback d-block">
                    <div class="error" v-for="msg in subErrors[choice.key]">{{ msg }}</div>
                </div>
            </div>
        </template>
        <template #viewMode>
            <div v-for="choice in choices" :key="choice.key">
                {{ choice.label }}: {{ subValues[choice.key] ? trueLabel : falseLabel }}
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { ChoiceList, MessageBag, FormValue } from '@/main';
import { provide, computed, ref, toRefs, watchEffect, inject } from 'vue';
import { coerceToBoolean, getUniqueKey, commonProps, useFormField, spliceMessageBag, reindexErrors, symbols } from '@/main';
import { FieldWrapper } from '@/main';

type BooleansMap = {[key: string]: boolean};
type KeysList = (string | number)[];

const props = defineProps(Object.assign({}, commonProps, {
    directory: {
        type: String,
        required: true,
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
const inputEleId = ref(getUniqueKey());

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

const { modelValue, myErrors, errors } = useFormField<KeysList>(coerceFn, emit, propRefs);

const provider = inject(symbols.choiceListProvider);

const choices = ref<ChoiceList>([]);

watchEffect(() => {
    if (props.directory != null && provider != null && provider.value != null) {
        provider.value.get(props.directory, props.extraParams).then((choiceListResult) => {
            choices.value = choiceListResult || [];
        });
    }
});

const subValues = computed((): BooleansMap => {
    const out: BooleansMap = {};
    choices.value.forEach((choice) => {
        out[String(choice.key)] = modelValue.value.includes(choice.key);
    });
    return out;
});

const toggle = (key: string | number): void => {
    const newValue = modelValue.value.slice();
    if (newValue.includes(key)) {
        // This key is being turned off
        const index = newValue.indexOf(key);
        newValue.splice(index, 1);
        // We'll also need to shift error message indexes
        errors.value = reindexErrors(errors.value, (oldIndex) => {
            if (oldIndex === index) {
                // errors from the deleted key should be discarded
                return undefined;
            } else if (oldIndex > index) {
                // errors from keys after the deleted one will shift backwards one position
                return oldIndex - 1;
            } else {
                return oldIndex;
            }
        });
    } else {
        // This key is being turned on
        newValue.push(key);
    }
    modelValue.value = newValue;
};

const subErrors = computed((): MessageBag => {
    console.log('Recalculating sub errors');
    console.log('modelValue', modelValue.value.join(','));
    const out: MessageBag = {};
    choices.value.forEach((choice) => {
        const index = modelValue.value.indexOf(choice.key);
        console.log(choice.key, index);
        if (index == -1) {
            out[choice.key] = [];
        } else {
            out[choice.key] = errors.value[String(index)] || [];
        }
    });
    return out;
});

const hasSubErrors = computed((): BooleansMap => {
    const out: BooleansMap = {};
    choices.value.forEach((choice) => {
        out[choice.key] = subErrors.value[choice.key].length > 0;
    });
    return out;
});

</script>

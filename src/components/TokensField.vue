<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <SearchField v-if="editable && searchable" v-model="temp" placeholder="Search" :disabled="disabled" :directory="directory" />
            <SelectField v-if="editable && ! searchable" v-model="temp" placeholder="Select" :disabled="disabled" :choices="choices" :directory="directory" />
            <div v-pclass="'tokens-list'">
                <div v-for="token in tokens" v-pclass="'token'">
                    <div v-pclass="'token-content'">
                        <slot name="tokenContent" v-if="! isPending(token)" :token="token">{{ token.label || token.key }}</slot>
                        <slot name="pendingTokenContent" v-if="isPending(token)" :token="token">{{ token.key }}</slot>
                    </div>
                    <div v-if="editable" v-pclass="'token-delete'" @click="removeToken(token.key)">
                        <button class="btn btn-sm btn-outline-danger"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, KeysList, Choosable, PendingChoosable } from '@/main';
import { computed, ref, toRefs, watch, watchEffect, inject } from 'vue';
import { SearchField, SelectField, commonProps, useFormField, useHasChoices, symbols, coerceToKeysList } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {
    searchable: {
        type: Boolean,
        required: true,
    },
    directory: {
        type: String,
    },
    choices: {
        type: [String, Object, Array],
    },
    extraParams: {
        type: Object,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: KeysList): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const { editMode, modelValue, FieldWrapper, standardWrapperProps } = useFormField<KeysList>(coerceToKeysList, emit, propRefs, {
    fieldTypeSlug: 'tokens'
});

const editable = computed((): boolean => {
    return editMode.value == 'edit' && ! props.disabled;
});

const provider = inject(symbols.choicesProvider);

const searchCache = ref<Record<string, Choosable>>({});

watchEffect(() => {
    if (props.searchable && props.choices == null) {
        modelValue.value.forEach((key) => {
            if (props.directory != null && provider != null) {
                const cacheKey = props.directory + '.' + String(key);
                if (searchCache.value[cacheKey] == null) {
                    provider.value.lookup(props.directory, key).then((searchResult) => {
                        if (searchResult.status == 'found') {
                            searchCache.value[cacheKey] = searchResult.resource;
                        }
                    });
                }
            }
        });
    }
});

// We only want the full list of possible choices when using the SelectField version
const { choicesNormalized } = useHasChoices({
    directory: computed(() => props.searchable ? undefined : props.directory),
    choices: computed(() => props.searchable ? undefined : propRefs.choices),
    extraParams: propRefs.extraParams,
});

const isPending = (choice: PendingChoosable | Choosable): choice is PendingChoosable => {
    return 'pending' in choice;
};

const tokens = computed((): (PendingChoosable | Choosable)[] => {
    return modelValue.value.map((key) => {
        const fallback: PendingChoosable = {pending: true, key: key};
        if (props.searchable && props.choices == null) {
            const cacheKey = props.directory + '.' + String(key);
            return searchCache.value[cacheKey] || fallback;
        } else {
            return choicesNormalized.value.find((choice) => choice.key == key) || fallback;
        }
    });
});

// Temporary value used by the SearchField or SelectField
const temp = ref<string | number | undefined>(undefined);

// When the temp value changes, add the new token to the list, then reset it
watch(temp, () => {
    if (temp.value != null) {
        addToken(temp.value);
    }
    window.setTimeout(() => {
        temp.value = undefined;
    }, 10);
});

const addToken = (key: string | number): void => {
    if (props.disabled || modelValue.value.includes(key)) {
        return;
    }
    const newValue = coerceToKeysList(modelValue.value); // creates a copy
    newValue.push(key);
    modelValue.value = newValue;
};

const removeToken = (key: string | number): void => {
    const index = modelValue.value.indexOf(key);
    if (props.disabled || index < 0) {
        return;
    }
    const newValue = coerceToKeysList(modelValue.value); // creates a copy
    newValue.splice(index, 1);
    modelValue.value = newValue;
};

</script>

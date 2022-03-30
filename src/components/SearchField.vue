<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="input-group">
                <div class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" @click="toggleOpenSearch">
                    <slot v-if="currentItem" name="suggestion" :suggestion="currentItem">{{ displayValue }}</slot>
                    <span v-if="placeholder && ! currentItem">{{ placeholder }}</span>
                </div>
                <button class="btn btn-outline-primary" type="button" @click="toggleOpenSearch"><i class="fas fa-search"></i></button>
                <button v-if="modelValue" class="btn btn-outline-danger" type="button" @click="chooseSuggestion(undefined)"><i class="fas fa-times"></i></button>
            </div>
            <SearchInterface v-if="searchOpen" :searchFn="searchFn" @close="closeSearch" @selected="chooseSuggestion">
                <template #noResults="{ searchText }">
                    <slot name="noResults" :searchText="searchText">
                        <div class="form-text text-warning">No results</div>
                    </slot>
                </template>
                <template #suggestion="{ suggestion }">
                    <slot name="suggestion" :suggestion="suggestion">{{ suggestion.label }}</slot>
                </template>
            </SearchInterface>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, Choosable, SearchResultPage } from '@/main';
import { computed, ref, toRefs, watchEffect, inject, onBeforeUnmount } from 'vue';
import { commonProps, useFormField, symbols } from '@/main';
import { FieldWrapper } from '@/main';
import SearchInterface from './SearchInterface.vue';

type IdType = string | number | undefined;

const props = defineProps(Object.assign({}, commonProps, {
    directory: {
        type: String,
        required: true,
    },
    extraParams: {
        type: Object,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: IdType): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): IdType => {
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
            return value;
    }
    return undefined;
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<IdType>(coerceFn, emit, propRefs);

const provider = inject(symbols.choicesProvider);

const currentItem = ref<Choosable | null>(null);

watchEffect(() => {
    currentItem.value = null;
    if (props.directory != null && provider != null && modelValue.value != null) {
        provider.value.lookup(props.directory, modelValue.value, props.extraParams).then((searchResult) => {
            currentItem.value = searchResult;
        });
    }
});

const searchFn = (searchTextValue: string, page: number) => {
    if (props.directory == null || provider == null) {
        console.log("Cannot perform search - directory or provider are not set", props.directory, provider);
        return null;
    }
    if (searchTextValue.length < 3) {
        return null;
    }
    return provider.value.search(props.directory, searchTextValue, page, props.extraParams);
};

// Is the search interface open or not?
const searchOpen = ref(false);

const toggleOpenSearch = () => {
    if (searchOpen.value) {
        closeSearch();
    } else {
        openSearch();
    }
};

const closeSearch = () => {
    searchOpen.value = false;
};

const openSearch = () => {
    if (props.disabled) {
        return;
    }
    searchOpen.value = true;
};

const chooseSuggestion = (suggestion: Choosable | undefined) => {
    if (props.disabled) {
        return;
    }
    closeSearch();
    modelValue.value = (suggestion == null ? undefined : suggestion.key);
};

const displayValue = computed((): string => {
    if (currentItem.value) {
        return currentItem.value.label;
    } else if (modelValue.value) {
        return String(modelValue.value);
    } else {
        return '';
    }
});

</script>

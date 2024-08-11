<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div class="input-group">
                <div class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" @click="maybeToggleOpenSearch">
                    <slot v-if="currentItem" name="suggestion" :suggestion="currentItem">{{ displayValue }}</slot>
                    <span v-if="placeholder && ! currentItem">{{ placeholder }}</span>
                </div>
                <button v-if="! disabled" class="btn btn-outline-primary" type="button" @click="toggleOpenSearch"><i class="fas fa-search"></i></button>
                <button v-if="! disabled && modelValue" class="btn btn-outline-danger" type="button" @click="clearValue"><i class="fas fa-times"></i></button>
            </div>
            <SearchInterface v-if="searchOpen"
                v-model="searchText"
                :suggestions="suggestions"
                :isSearching="isSearching"
                :noResults="noResults"
                :canFetchMore="canFetchMore"
                @enterPress="searchDebounced"
                @fetchNextPage="fetchNextPage"
                @close="closeSearch"
                @selected="chooseSuggestion"
            >
                <template #noResults>
                    <slot name="noResults" :searchText="searchText">
                        <div class="form-text text-warning">No results</div>
                    </slot>
                </template>
                <template #suggestion="{ suggestion }">
                    <slot name="suggestion" :suggestion="suggestion">{{ (suggestion as Choosable).label }}</slot>
                </template>
            </SearchInterface>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, Choosable, SearchResultPage } from '../main';
import { computed, ref, toRefs, watchEffect, inject } from 'vue';
import { commonProps, useFormField, useSearches, symbols } from '../main';
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

const slots = defineSlots<{
    suggestion: (props: {suggestion: Choosable}) => any,
    noResults: (props: {searchText: string}) => any,
}>();

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

const { modelValue, hasError, FieldWrapper, standardWrapperProps } = useFormField<IdType>(coerceFn, emit, propRefs, {
    fieldTypeSlug: 'search'
});

const provider = inject(symbols.choicesProvider);

const currentItem = ref<Choosable | null>(null);

watchEffect(() => {
    currentItem.value = null;
    if (props.directory != null && provider != null && modelValue.value != null) {
        provider.value.lookup(props.directory, modelValue.value, props.extraParams).then((searchResult) => {
            if (searchResult.status == 'found') {
                currentItem.value = searchResult.resource;
            }
        });
    }
});

const searchFn = (page: number): Promise<SearchResultPage<Choosable>> | null => {
    if (props.directory == null || provider == null) {
        console.log("Cannot perform search - directory or provider are not set", props.directory, provider);
        return null;
    }
    if (searchText.value.length < 3) {
        return null;
    }
    return provider.value.search(props.directory, searchText.value, page, props.extraParams);
};

const { searchText, suggestions, noResults, canFetchMore, isSearching, fetchNextPage, searchDebounced, searchOpen, toggleOpenSearch, closeSearch } = useSearches<Choosable>(searchFn);

const maybeToggleOpenSearch = () => {
    if (! props.disabled) {
        toggleOpenSearch();
    }
};

const chooseSuggestion = (index: number) => {
    const suggestion = suggestions.value[index];
    if (props.disabled || suggestion == null) {
        return;
    }
    closeSearch();
    modelValue.value = suggestion.key;
};

const clearValue = () => {
    if (props.disabled) {
        return;
    }
    closeSearch();
    modelValue.value = undefined;
}

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

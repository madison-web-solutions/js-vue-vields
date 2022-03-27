<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="input-group">
                <input type="text" class="form-control" :class="{'is-invalid': hasError}" readonly :disabled="disabled" :placeholder="placeholder" :value="displayValue" @click="toggleOpenSearch"/>
                <button class="btn btn-outline-primary" type="button" @click="toggleOpenSearch"><i class="fas fa-search"></i></button>
                <button v-if="modelValue" class="btn btn-outline-danger" type="button" @click="chooseSuggestion(undefined)"><i class="fas fa-times"></i></button>
            </div>
            <div ref="searchInterface" v-if="searchOpen">
                <input :id="inputEleId" class="form-control" ref="searchInput" type="text" placeholder="Search" :disabled="disabled" v-model="searchText" @input="searchDebounced" @keydown.enter.prevent="searchDebounced" />
                <div class="search-field-results" @scroll="handleScroll">
                    <slot v-if="noResults" name="noResults" :searchString="searchText">
                        <div class="form-text text-warning">No results</div>
                    </slot>
                    <div v-if="suggestions.length > 0" class="list-group">
                        <button v-for="suggestion in suggestions" class="list-group-item list-group-item-action" type="button" @click="chooseSuggestion(suggestion)">{{ suggestion.label }}</button>
                    </div>
                    <div v-if="canFetchMore">
                        <button class="btn btn-link" type="button" @click="fetchNextPage">more</button>
                    </div>
                    <div v-if="searchingId != null" class="form-text">Searching...</div>
                </div>
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag, Choosable, ChoiceList, SearchResultPage } from '@/main';
import { computed, ref, toRefs, watchEffect, inject, onBeforeUnmount } from 'vue';
import { commonProps, useFormField, symbols } from '@/main';
import { FieldWrapper } from '@/main';

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

const provider = inject(symbols.searchProvider);

const currentItem = ref<Choosable | null>(null);

watchEffect(() => {
    currentItem.value = null;
    if (props.directory != null && provider != null && modelValue.value != null) {
        provider.value.lookup(props.directory, modelValue.value, props.extraParams).then((searchResult) => {
            currentItem.value = searchResult;
        });
    }
});

const searchInput = ref<HTMLInputElement | null>(null);
const searchInterface = ref<HTMLInputElement | null>(null);

// Is the search interface open or not?
const searchOpen = ref(false);

// 2 way binding to the search input box
const searchText = ref<string>('');

// Array of search result pages fetched so far.  Null means we haven't searched for anything.
const fetchedPages = ref<SearchResultPage[] | null>(null);

// Array of all the suggestions fetched so for.
const suggestions = computed((): ChoiceList => {
    const out: ChoiceList = [];
    if (fetchedPages.value != null) {
        for (const result of fetchedPages.value) {
            out.push(...result.suggestions);
        }
    }
    return out;
});

// Page number of the most recently fetched page of search results, or zero if we haven't searched for anything
const lastPage = computed((): number => {
    if (fetchedPages.value == null) {
        return 0;
    } else {
        return fetchedPages.value[fetchedPages.value.length - 1].page;
    }
});

// Are there more results available for the current search (or false if we haven't searched for anything)
const hasMore = computed((): boolean => {
    if (fetchedPages.value == null) {
        return false;
    } else {
        return fetchedPages.value[fetchedPages.value.length - 1].hasMore;
    }
});

// Unique id number of the search request that we are currently waiting for (or null if we are not searching at the moment)
const searchingId = ref<number | null>(null);

// Should we show the 'no results' message?  This should be shown, if we have done a search and received the results, and the results were empty
const noResults = computed((): boolean => {
    return fetchedPages.value != null && suggestions.value.length == 0;
});

// Can we fetch additional results for the current search text?  True if the previous results page says there are more available, and we are not already searching
const canFetchMore = computed((): boolean => {
    return hasMore.value && searchingId.value == null;
});

const toggleOpenSearch = () => {
    if (searchOpen.value) {
        closeSearch();
    } else {
        openSearch();
    }
};

// Close the search interface if the user has clicked on the page outside of it
const maybeCloseSearch = (e: MouseEvent) => {
    const target = e.target as Element;
    if (searchOpen.value && document.body.contains(target) && searchInterface.value != null) {
        if (searchInterface.value === target || searchInterface.value.contains(target)) {
            // User clicked inside the search interface, so leave it open
        } else {
            // user clicked outside the search interface, so interpret this as trying to close the search
            closeSearch();
        }
    }
};

const closeSearch = () => {
    document.removeEventListener('click', maybeCloseSearch);
    if (searchInput.value) {
        searchInput.value.value = '';
    }
    searchOpen.value = false;
    fetchedPages.value = null;
    searchingId.value = null;
};

const openSearch = () => {
    if (props.disabled) {
        return;
    }
    fetchedPages.value = null;
    searchOpen.value = true;
    window.setTimeout(() => {
        if (searchInput.value) {
            searchInput.value.value = '';
            searchInput.value.focus();
        }
        document.addEventListener('click', maybeCloseSearch);
    }, 10);
};

let timeoutId: number | undefined = undefined;
const searchDebounced = () => {
    fetchedPages.value = null;
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
        if (searchText.value.length > 2) {
            doSearch(searchText.value, 1);
        }
    }, 300);
};

const fetchNextPage = () => {
    doSearch(searchText.value, lastPage.value + 1);
};

let searchCount: number = 1;
const doSearch = (searchTextValue: string, page: number) => {
    if (props.directory == null || provider == null) {
        console.log("Cannot perform search - directory or provider are not set", props.directory, provider);
        fetchedPages.value = null;
        return;
    }
    if (searchTextValue.length < 3) {
        console.log("Not long enough", searchTextValue);
        fetchedPages.value = null;
        return;
    }
    const searchId = searchCount++;
    searchingId.value = searchId;
    provider.value.search(props.directory, searchTextValue, page, props.extraParams).then((searchResultPage) => {
        if (searchingId.value === searchId) {
            // only act on the results if this is still the most recent search operation
            if (fetchedPages.value == null) {
                fetchedPages.value = [];
            }
            fetchedPages.value.push(searchResultPage);
            searchingId.value = null;
        }
    });
};

// Fetch the next page of results when the user scrolls to the bottom of the search results
const handleScroll = (e: Event) => {
    if (canFetchMore.value) {
        const ele = e.target as HTMLElement;
        const scrollProportion = ((ele.scrollTop + ele.offsetHeight) / ele.scrollHeight);
        if (scrollProportion > 0.9) {
            fetchNextPage();
        }
    }
};

const chooseSuggestion = (suggestion: Choosable | undefined) => {
    if (props.disabled) {
        return;
    }
    closeSearch();
    modelValue.value = (suggestion == null ? undefined : suggestion.key);
};

// Remove the maybeCloseSearch listener before unmounting
onBeforeUnmount(() => {
    document.removeEventListener('click', maybeCloseSearch);
});

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

<template>
    <div ref="container">
        <input class="form-control" ref="searchInput" type="text" placeholder="Search" v-model="searchText" @input="searchDebounced" @keydown.enter.prevent="searchDebounced" />
        <div class="search-field-results" @scroll="handleScroll">
            <slot v-if="noResults" name="noResults" :searchText="searchText">
                <div class="form-text text-warning">No results</div>
            </slot>
            <div v-if="suggestions.length > 0" class="list-group">
                <button v-for="suggestion in suggestions" class="list-group-item list-group-item-action" type="button" @click="emit('selected', suggestion)">
                    <slot name="suggestion" :suggestion="suggestion">{{ suggestion.label }}</slot>
                </button>
            </div>
            <div v-if="canFetchMore">
                <button class="btn btn-link" type="button" @click="fetchNextPage">more</button>
            </div>
            <div v-if="searchingId != null" class="form-text">Searching...</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { Choosable, SearchResultPage } from '@/main';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

type SearchFn = (searchtext: string, page: number) => Promise<SearchResultPage<Choosable>> | null;

const props = defineProps({
    searchFn: {
        type: Function as PropType<SearchFn>,
        required: true,
    }
});

const emit = defineEmits<{
    (e: 'close'): void,
    (e: 'selected', item: Choosable): void
}>();

const container = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// 2 way binding to the search input box
const searchText = ref<string>('');

// Array of search result pages fetched so far.  Null means we haven't searched for anything.
const fetchedPages = ref<SearchResultPage<Choosable>[] | null>(null);

// Array of all the suggestions fetched so for.
const suggestions = computed((): Choosable[] => {
    const out: Choosable[] = [];
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

// Close the search interface if the user has clicked on the page outside of it
const maybeCloseSearch = (e: MouseEvent) => {
    const target = e.target as Element;
    if (document.body.contains(target) && container.value != null) {
        if (container.value === target || container.value.contains(target)) {
            // User clicked inside the search interface, so leave it open
        } else {
            // user clicked outside the search interface, so interpret this as trying to close the search
            emit('close');
        }
    }
};

onMounted(() => {
    searchInput.value && searchInput.value.focus();
    window.setTimeout(() => document.addEventListener('click', maybeCloseSearch), 10);
});

// Remove the maybeCloseSearch listener before unmounting
onBeforeUnmount(() => {
    document.removeEventListener('click', maybeCloseSearch);
});

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

const fetchNextPage = () => {
    doSearch(searchText.value, lastPage.value + 1);
};

let searchCount: number = 1;
const doSearch = (searchTextValue: string, page: number) => {
    if (props.searchFn == null) {
        fetchedPages.value = null;
        return;
    }
    const promise = props.searchFn(searchTextValue, page);
    if (promise == null) {
        fetchedPages.value = null;
        return;
    }
    const searchId = searchCount++;
    searchingId.value = searchId;
    promise.then((searchResultPage) => {
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

</script>
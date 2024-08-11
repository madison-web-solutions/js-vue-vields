import type { Ref } from "vue";
import type { SearchResultPage } from "../main";
import { computed, ref, watch } from "vue";

export function useSearches<T>(
  searchFn: (page: number) => Promise<SearchResultPage<T>> | null,
) {
  const searchText = ref<string>("");

  // Array of search result pages fetched so far.  Null means we haven't searched for anything.
  //const fetchedPages = ref<SearchResultPage<Tp>[] | null>(null);
  const fetchedPages: Ref<SearchResultPage<T>[] | null> = ref(null);

  // Array of all the suggestions fetched so for.
  const suggestions = computed((): T[] => {
    const out: T[] = [];
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

  // Have done a search and received the results, and the results were empty?
  const noResults = computed((): boolean => {
    return fetchedPages.value != null && suggestions.value.length == 0;
  });

  // Can we fetch additional results for the current search parameters?
  // True if the previous results page says there are more available, and we are not already searching
  const canFetchMore = computed((): boolean => {
    return hasMore.value && searchingId.value == null;
  });

  let searchCount: number = 1;
  const doSearch = (page: number) => {
    const searchId = searchCount++;
    searchingId.value = searchId;
    const promise = searchFn(page);
    if (promise == null) {
      // search was not attempted - for example if search string is too short
    } else {
      promise.then((result: SearchResultPage<T>) => {
        if (searchingId.value === searchId) {
          // only act on the results if this is still the most recent search operation
          if (fetchedPages.value == null) {
            fetchedPages.value = [];
          }
          fetchedPages.value.push(result);
          searchingId.value = null;
        }
      });
    }
  };

  const isSearching = computed((): boolean => {
    return searchingId.value != null;
  });

  const fetchFirstPage = () => {
    fetchedPages.value = null;
    doSearch(1);
  };

  const fetchNextPage = () => {
    doSearch(lastPage.value + 1);
  };

  let timeoutId: number | undefined = undefined;
  const searchDebounced = () => {
    fetchedPages.value = null;
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => doSearch(1), 300);
  };

  watch(searchText, searchDebounced);

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
    searchText.value = "";
    searchOpen.value = true;
  };

  return {
    searchText,
    fetchedPages,
    suggestions,
    lastPage,
    hasMore,
    noResults,
    canFetchMore,
    isSearching,
    fetchFirstPage,
    fetchNextPage,
    searchDebounced,
    searchOpen,
    toggleOpenSearch,
    closeSearch,
    openSearch,
  };
}

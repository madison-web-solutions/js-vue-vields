import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import useSearches from '../src/lib/useSearches';
import type { SearchResultPage } from '../src/types';

const pg = (page: number, hasMore: boolean, suggestions: string[]): SearchResultPage<string> =>
  ({ page, hasMore, suggestions });

// Fake timers throughout so the 300ms debounce is controllable; flushPromises still resolves
// microtask-based promises under fake timers.

describe('useSearches', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('fetchFirstPage fetches page 1 and exposes the suggestions', async () => {
    const searchFn = vi.fn().mockResolvedValue(pg(1, false, ['a', 'b']));
    const s = useSearches<string>(searchFn);
    s.fetchFirstPage();
    await flushPromises();
    expect(searchFn).toHaveBeenCalledWith(1);
    expect(s.suggestions.value).toEqual(['a', 'b']);
    expect(s.isSearching.value).toBe(false);
  });

  test('fetchNextPage appends the next page and tracks hasMore / canFetchMore', async () => {
    const searchFn = vi.fn()
      .mockResolvedValueOnce(pg(1, true, ['a']))
      .mockResolvedValueOnce(pg(2, false, ['b']));
    const s = useSearches<string>(searchFn);
    s.fetchFirstPage();
    await flushPromises();
    expect(s.hasMore.value).toBe(true);
    expect(s.canFetchMore.value).toBe(true);

    s.fetchNextPage();
    await flushPromises();
    expect(searchFn).toHaveBeenLastCalledWith(2);
    expect(s.suggestions.value).toEqual(['a', 'b']);
    expect(s.hasMore.value).toBe(false);
    expect(s.canFetchMore.value).toBe(false);
  });

  test('discards a stale response when a newer search has started', async () => {
    const deferred: ((p: SearchResultPage<string>) => void)[] = [];
    const searchFn = vi.fn(() => new Promise<SearchResultPage<string>>((res) => deferred.push(res)));
    const s = useSearches<string>(searchFn);

    s.fetchFirstPage(); // request #1
    s.fetchFirstPage(); // request #2 (newer)

    // Resolve the newer request first, then the older one — the older must be ignored.
    deferred[1](pg(1, false, ['fresh']));
    await flushPromises();
    deferred[0](pg(1, false, ['stale']));
    await flushPromises();

    expect(s.suggestions.value).toEqual(['fresh']);
  });

  test('isSearching does not get stuck when searchFn returns null', () => {
    const searchFn = vi.fn().mockReturnValue(null);
    const s = useSearches<string>(searchFn);
    s.fetchFirstPage();
    expect(s.isSearching.value).toBe(false);
    expect(s.suggestions.value).toEqual([]);
  });

  test('changing searchText searches once after a 300ms debounce', async () => {
    const searchFn = vi.fn().mockResolvedValue(pg(1, false, ['x']));
    const s = useSearches<string>(searchFn);

    s.searchText.value = 'query';
    await nextTick(); // let the watcher schedule the debounce
    expect(searchFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(searchFn).toHaveBeenCalledWith(1);
    expect(s.suggestions.value).toEqual(['x']);
  });

  test('openSearch clears the text and opens; toggle and close work', () => {
    const s = useSearches<string>(vi.fn().mockReturnValue(null));
    s.searchText.value = 'old';

    s.openSearch();
    expect(s.searchOpen.value).toBe(true);
    expect(s.searchText.value).toBe('');

    s.toggleOpenSearch(); // open → close
    expect(s.searchOpen.value).toBe(false);
    s.toggleOpenSearch(); // close → open
    expect(s.searchOpen.value).toBe(true);

    s.closeSearch();
    expect(s.searchOpen.value).toBe(false);
  });
});

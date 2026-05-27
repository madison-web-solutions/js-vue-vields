import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { MediaProvider } from '../src/types';
import { makeResizableItem, makeFileList } from './media-utils';
import injectionSymbols from '../src/lib/injection-symbols';
import MediaLibrary from '../src/components/media/MediaLibrary.vue';
import MediaPreview from '../src/components/media/MediaPreview.vue';
import MediaDetails from '../src/components/media/MediaDetails.vue';

// MediaLibrary searches (useSearches, 300ms debounce), uploads files sequentially, and (in
// standalone mode) opens MediaDetails to delete. MediaDetails is stubbed so we don't need its
// ResizeObserver / lookup. File selection uses the makeFileList helper to satisfy the component's
// `files instanceof FileList` guard.

const mockSearch = vi.fn();
const mockUpload = vi.fn();
const mockDelete = vi.fn();
const mockProvider: MediaProvider = {
  search: mockSearch,
  lookup: vi.fn(),
  upload: mockUpload,
  delete: mockDelete,
  update: vi.fn(),
};

const mountLibrary = (props: Record<string, unknown> = {}) =>
  mount(MediaLibrary, {
    props,
    global: {
      provide: { [injectionSymbols.mediaProvider as symbol]: mockProvider },
      stubs: { MediaDetails: true },
    },
  });

// Attach a FileList to the upload input and fire change.
const selectFiles = async (w: ReturnType<typeof mount>, files: File[]) => {
  const input = w.find('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: makeFileList(files), configurable: true });
  await input.trigger('change');
};

describe('MediaLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => { vi.useRealTimers(); });

  test('fetches the first page of results on mount', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [makeResizableItem({ id: 1 }), makeResizableItem({ id: 2 })] });
    const w = mountLibrary();
    await flushPromises();
    expect(mockSearch).toHaveBeenCalledWith('', 1, {});
    expect(w.findAllComponents(MediaPreview).length).toBe(2);
  });

  test('typing in the search box searches after the debounce', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [] });
    const w = mountLibrary();
    await flushPromises();
    mockSearch.mockClear();
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [makeResizableItem({ id: 9 })] });

    await w.find('input[type="text"]').setValue('cat');
    expect(mockSearch).not.toHaveBeenCalled(); // debounced

    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(mockSearch).toHaveBeenCalledWith('cat', 1, {});
    expect(w.findAllComponents(MediaPreview).length).toBe(1);
  });

  test('the more button fetches the next page and appends results', async () => {
    mockSearch
      .mockResolvedValueOnce({ page: 1, hasMore: true,  suggestions: [makeResizableItem({ id: 1 })] })
      .mockResolvedValueOnce({ page: 2, hasMore: false, suggestions: [makeResizableItem({ id: 2 })] });
    const w = mountLibrary();
    await flushPromises();
    expect(w.findAllComponents(MediaPreview).length).toBe(1);
    expect(w.find('.btn-link').text()).toContain('more');

    await w.find('.btn-link').trigger('click');
    await flushPromises();
    expect(w.findAllComponents(MediaPreview).length).toBe(2);
    expect(w.find('.btn-link').exists()).toBe(false);
  });

  test('clicking a result emits select with the id (non-standalone)', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [makeResizableItem({ id: 42 })] });
    const w = mountLibrary({ standalone: false });
    await flushPromises();
    w.findComponent(MediaPreview).vm.$emit('select');
    expect(w.emitted('select')?.[0]).toEqual([42]);
  });

  test('clicking a result enters details mode in standalone mode', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [makeResizableItem({ id: 42 })] });
    const w = mountLibrary({ standalone: true });
    await flushPromises();
    w.findComponent(MediaPreview).vm.$emit('select');
    await flushPromises();
    expect(w.findComponent(MediaDetails).exists()).toBe(true);
    expect(w.emitted('select')).toBeFalsy();
  });

  test('uploading a single file calls provider.upload and auto-selects it', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [] });
    const uploaded = makeResizableItem({ id: 99, title: 'photo' });
    mockUpload.mockImplementation((_data: FormData, cb: (l: number, t: number) => void) => {
      cb(50, 100);
      return Promise.resolve({ status: 'ok', resource: uploaded });
    });
    const w = mountLibrary({ standalone: false });
    await flushPromises();

    await selectFiles(w, [new File(['x'], 'photo.png', { type: 'image/png' })]);
    await flushPromises();

    expect(mockUpload).toHaveBeenCalledTimes(1);
    const formData = mockUpload.mock.calls[0][0] as FormData;
    expect((formData.get('file') as File).name).toBe('photo.png');
    expect(formData.get('title')).toBe('photo');
    expect(w.emitted('select')?.[0]).toEqual([99]);
  });

  test('a failed upload shows an error box', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [] });
    mockUpload.mockResolvedValue({ status: 'fail', errors: { '': ['Too big'] } });
    const w = mountLibrary({ standalone: false });
    await flushPromises();

    await selectFiles(w, [new File(['x'], 'big.png')]);
    await flushPromises();

    const errorBox = w.find('[data-upload-status="error"]');
    expect(errorBox.exists()).toBe(true);
    expect(errorBox.text()).toContain('Too big');
  });

  test('deleting from the details view removes the item from the grid', async () => {
    mockSearch.mockResolvedValue({ page: 1, hasMore: false, suggestions: [makeResizableItem({ id: 42 })] });
    mockDelete.mockResolvedValue(true);
    const w = mountLibrary({ standalone: true });
    await flushPromises();

    w.findComponent(MediaPreview).vm.$emit('select'); // enter details for id 42
    await flushPromises();
    w.findComponent(MediaDetails).vm.$emit('delete');
    await flushPromises();

    expect(mockDelete).toHaveBeenCalledWith(42);
    expect(w.findComponent(MediaDetails).exists()).toBe(false);
    expect(w.findAllComponents(MediaPreview).length).toBe(0);
  });
});

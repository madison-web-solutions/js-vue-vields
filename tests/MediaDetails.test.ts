import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import type { MediaProvider } from '../src/types';
import { makeMediaItem, makeResizableItem } from './media-utils';
import injectionSymbols from '../src/lib/injection-symbols';
import MediaDetails from '../src/components/media/MediaDetails.vue';

// MediaDetails loads an item via provider.lookup, edits title/alt (+crop when configured), and
// saves via provider.update / replaces via provider.replace. It instantiates a ResizeObserver at
// setup, which jsdom lacks — so we stub it. Crop-center geometry is layout-dependent and untestable
// in jsdom, so we only assert the crop fields' presence based on config.
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const mockLookup = vi.fn();
const mockUpdate = vi.fn();
const mockReplace = vi.fn();
const baseProvider: MediaProvider = {
  search: vi.fn(),
  lookup: mockLookup,
  upload: vi.fn(),
  delete: vi.fn(),
  update: mockUpdate,
};
const providerWithReplace: MediaProvider = { ...baseProvider, replace: mockReplace };

type MountOpts = { provider?: MediaProvider; config?: ReturnType<typeof ref> };

const mountDetails = (props: Record<string, unknown>, opts: MountOpts = {}) => {
  const provide: Record<symbol, unknown> = {
    [injectionSymbols.mediaProvider as symbol]: opts.provider ?? providerWithReplace,
  };
  if (opts.config) provide[injectionSymbols.config as symbol] = opts.config;
  return mount(MediaDetails, {
    props: { editable: true, deletable: false, ...props },
    global: { provide },
  });
};

const saveButton = (w: ReturnType<typeof mount>) => w.find('button.btn-primary');
const deleteButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text() === 'Delete');

describe('MediaDetails', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.useRealTimers(); });

  test('looks up the item on mount and populates the fields', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem({ id: 1, title: 'Hello', alt: 'Alt text' }) });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();
    expect(mockLookup).toHaveBeenCalledWith(1);
    expect((w.find('input[name="title"]').element as HTMLInputElement).value).toBe('Hello');
    expect((w.find('input[name="alt"]').element as HTMLInputElement).value).toBe('Alt text');
  });

  test('shows missing status when the lookup fails', async () => {
    mockLookup.mockResolvedValue({ status: 'not-found' });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();
    expect(w.text()).toContain('missing');
  });

  test('the save button appears only after an edit', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem({ title: 'Hello' }) });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();
    expect(saveButton(w).exists()).toBe(false);
    await w.find('input[name="title"]').setValue('Changed');
    expect(saveButton(w).exists()).toBe(true);
  });

  test('saving calls provider.update with the edited values and emits updated', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem({ id: 1, title: 'Hello' }) });
    const updated = makeMediaItem({ id: 1, title: 'Changed' });
    mockUpdate.mockResolvedValue({ status: 'ok', resource: updated });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();

    await w.find('input[name="title"]').setValue('Changed');
    await saveButton(w).trigger('click');
    await flushPromises();

    expect(mockUpdate.mock.calls[0][0]).toBe(1);
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({ title: 'Changed' });
    expect(w.emitted('updated')?.[0]).toEqual([updated]);
    expect(saveButton(w).exists()).toBe(false); // reset → no longer dirty
  });

  test('a failed save shows the error on the field', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem({ title: 'Hello' }) });
    mockUpdate.mockResolvedValue({ status: 'fail', errors: { title: ['Title is required'] } });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();

    await w.find('input[name="title"]').setValue('');
    await saveButton(w).trigger('click');
    await flushPromises();

    expect(w.find('input[name="title"]').classes()).toContain('is-invalid');
    expect(w.text()).toContain('Title is required');
  });

  test('the delete button emits delete when deletable', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem() });
    const w = mountDetails({ itemId: 1, deletable: true });
    await flushPromises();
    await deleteButton(w)!.trigger('click');
    expect(w.emitted('delete')).toBeTruthy();
  });

  test('no delete button when not deletable', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem() });
    const w = mountDetails({ itemId: 1, deletable: false });
    await flushPromises();
    expect(deleteButton(w)).toBeUndefined();
  });

  test('replacing a file calls provider.replace and emits updated', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeResizableItem({ id: 1 }) });
    const replaced = makeResizableItem({ id: 1, title: 'new' });
    mockReplace.mockImplementation((_id: number, _data: FormData, cb: (l: number, t: number) => void) => {
      cb(100, 100);
      return Promise.resolve({ status: 'ok', resource: replaced });
    });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();

    const input = w.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'new.png')], configurable: true });
    await input.trigger('change');
    await flushPromises();

    expect(mockReplace.mock.calls[0][0]).toBe(1);
    expect(mockReplace.mock.calls[0][1]).toBeInstanceOf(FormData);
    expect(w.emitted('updated')?.[0]).toEqual([replaced]);
  });

  test('a failed replace shows the error message', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeResizableItem({ id: 1 }) });
    mockReplace.mockResolvedValue({ status: 'fail', errors: { '': ['Bad file'] } });
    const w = mountDetails({ itemId: 1 });
    await flushPromises();

    const input = w.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'bad.png')], configurable: true });
    await input.trigger('change');
    await flushPromises();

    expect(w.find('.text-danger').text()).toContain('Bad file');
  });

  test('no replace UI when the provider has no replace method', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeResizableItem({ id: 1 }) });
    const w = mountDetails({ itemId: 1 }, { provider: baseProvider });
    await flushPromises();
    expect(w.find('input[type="file"]').exists()).toBe(false);
    expect(w.text()).not.toContain('Replace File');
  });

  test('non-editable mode disables the fields and hides save', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeMediaItem({ title: 'Hello' }) });
    const w = mountDetails({ itemId: 1, editable: false });
    await flushPromises();
    expect((w.find('input[name="title"]').element as HTMLInputElement).disabled).toBe(true);
    expect(saveButton(w).exists()).toBe(false);
  });

  test('crop center fields appear only when the config enables them', async () => {
    mockLookup.mockResolvedValue({ status: 'found', resource: makeResizableItem({ id: 1, extension: 'jpg' }) });

    const w1 = mountDetails({ itemId: 1 });
    await flushPromises();
    expect(w1.text()).not.toContain('Crop Center');

    const w2 = mountDetails({ itemId: 1 }, { config: ref({ 'media.supportCropCenter': true }) });
    await flushPromises();
    expect(w2.text()).toContain('Crop Center');
  });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { EditMode, MediaProvider } from '../src/types';
import { lastEmittedValue } from './utils';
import { makeResizableItem } from './media-utils';
import injectionSymbols from '../src/lib/injection-symbols';
import MediaField from '../src/components/media/MediaField.vue';
import MediaPreview from '../src/components/media/MediaPreview.vue';
import MediaLibrary from '../src/components/media/MediaLibrary.vue';
import MediaDetails from '../src/components/media/MediaDetails.vue';

// MediaField's own logic is: value binding (useFormField), provider.lookup → preview, and opening
// the library / details modals. The modals use <Teleport> and the children make their own provider
// calls / use ResizeObserver, so we stub MediaLibrary and MediaDetails and drive their emits — this
// isolates MediaField and lets findComponent locate the (teleported) stubs.

const mockLookup = vi.fn();
const mockProvider: MediaProvider = {
  search: vi.fn(),
  lookup: mockLookup,
  upload: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
};

const mountField = (props: Record<string, unknown> = {}) =>
  mount(MediaField, {
    props,
    global: {
      provide: { [injectionSymbols.mediaProvider as symbol]: mockProvider },
      stubs: { MediaLibrary: true, MediaDetails: true },
    },
  });

describe('MediaField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookup.mockResolvedValue({ status: 'found', resource: makeResizableItem({ id: 5 }) });
  });

  test('renders an add button and no preview when the value is null', () => {
    const w = mountField({ modelValue: null });
    expect(w.find('.vfm-media-add-button').exists()).toBe(true);
    expect(w.findComponent(MediaPreview).exists()).toBe(false);
  });

  test('looks up the item and shows a preview when a value is set', async () => {
    const w = mountField({ modelValue: 5 });
    await flushPromises();
    expect(mockLookup).toHaveBeenCalledWith(5);
    expect(w.findComponent(MediaPreview).exists()).toBe(true);
  });

  test('removing the item emits update:modelValue null', async () => {
    const w = mountField({ modelValue: 5 });
    await flushPromises();
    w.findComponent(MediaPreview).vm.$emit('remove');
    await flushPromises();
    expect(lastEmittedValue(w)).toBeNull();
  });

  test('clicking the add button opens the library modal', async () => {
    const w = mountField({ modelValue: null });
    expect(w.findComponent(MediaLibrary).exists()).toBe(false);
    await w.find('.vfm-media-add-button').trigger('click');
    expect(w.findComponent(MediaLibrary).exists()).toBe(true);
  });

  test('selecting from the library emits the id and closes the modal', async () => {
    const w = mountField({ modelValue: null });
    await w.find('.vfm-media-add-button').trigger('click');
    w.findComponent(MediaLibrary).vm.$emit('select', 7);
    await flushPromises();
    expect(lastEmittedValue(w)).toBe(7);
    expect(w.findComponent(MediaLibrary).exists()).toBe(false);
  });

  test('clicking the preview opens the library modal', async () => {
    const w = mountField({ modelValue: 5 });
    await flushPromises();
    w.findComponent(MediaPreview).vm.$emit('select');
    await flushPromises();
    expect(w.findComponent(MediaLibrary).exists()).toBe(true);
  });

  test('inspecting the item opens the details modal', async () => {
    const w = mountField({ modelValue: 5 });
    await flushPromises();
    w.findComponent(MediaPreview).vm.$emit('inspect');
    await flushPromises();
    expect(w.findComponent(MediaDetails).exists()).toBe(true);
  });

  test('view mode renders a non-interactive preview', async () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { MediaField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        provide(injectionSymbols.mediaProvider, mockProvider);
        return { value: ref(5) };
      },
      template: '<MediaField v-model="value" />',
    });
    const w = mount(Parent, { global: { stubs: { MediaLibrary: true, MediaDetails: true } } });
    await flushPromises();
    expect(w.findComponent(MediaPreview).exists()).toBe(true);
    expect(w.find('.vfm-media-preview-remove').exists()).toBe(false);
    expect(w.find('.vfm-media-preview-inspect').exists()).toBe(false);
  });

  test('renders the field label', () => {
    const w = mountField({ modelValue: null, label: 'Featured Image' });
    expect(w.find('label').text()).toContain('Featured Image');
  });
});

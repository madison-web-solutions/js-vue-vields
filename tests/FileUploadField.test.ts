import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, provide, ref } from 'vue';
import type { EditMode, MessageBag, UploadProvider, UploadedFileCache } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';
import { createUploadedFileCache } from '../src/lib/uploadedFileCache';
import FileUploadField from '../src/components/FileUploadField.vue';
import FieldGroup from '../src/components/FieldGroup.vue';
import useUploadedFiles from '../src/lib/useUploadedFiles';

// crypto.subtle is unavailable in jsdom; mock the file helpers so tokens are deterministic
// (same content -> same token, which the dedup behaviour relies on).
vi.mock('../src/lib/file-utils', () => ({
  fileToSha256Hex: vi.fn(async (file: File) => `${file.name}_${file.size}`),
  fileToBase64: vi.fn(async (file: File) => `b64(${file.name})`),
}));

const makeFile = (name: string, content = 'data', type = 'application/pdf'): File =>
  new File([content], name, { type });

// Drive a native file <input> the way a user would: assign its FileList then fire `change`.
const selectFiles = async (wrapper: ReturnType<typeof mount>, files: File[]): Promise<void> => {
  const input = wrapper.find('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: files, configurable: true });
  await input.trigger('change');
  await flushPromises();
};

let cache: UploadedFileCache;

const mountField = (props: Record<string, unknown> = {}, provideExtra: Record<symbol, unknown> = {}) =>
  mount(FileUploadField, {
    props,
    global: {
      provide: {
        [injectionSymbols.uploadedFileCache as symbol]: cache,
        ...provideExtra,
      },
    },
  });

beforeEach(() => {
  cache = createUploadedFileCache();
  vi.clearAllMocks();
});

describe('FileUploadField — view mode', () => {
  const viewMode = () => ({ [injectionSymbols.editMode as symbol]: ref<EditMode>('view') });

  test('shows the noValueLabel when there is no file', () => {
    const w = mountField({ modelValue: null }, viewMode());
    expect(w.find('.vfm-no-value').text()).toBe('(none)');
    expect(w.find('.vfm-file-upload-list').exists()).toBe(false);
  });

  test('shows the noValueLabel when the multiple-file list is empty', () => {
    const w = mountField({ modelValue: [], multiple: true }, viewMode());
    expect(w.find('.vfm-no-value').text()).toBe('(none)');
  });

  test('lists the file, not the noValueLabel, when there is one', () => {
    const w = mountField({ modelValue: 'tok_1' }, viewMode());
    expect(w.find('.vfm-no-value').exists()).toBe(false);
    expect(w.find('.vfm-file-upload-item').text()).toBe('tok_1');
  });
});

describe('FileUploadField — inline mode', () => {
  test('selecting a file emits a vfmfile_ token and caches the File', async () => {
    const w = mountField({ modelValue: null });
    const file = makeFile('cv.pdf');
    await selectFiles(w, [file]);

    const token = lastEmittedValue(w) as string;
    expect(token).toBe(`vfmfile_cv.pdf_${file.size}`);
    expect(cache.has(token)).toBe(true);
    expect(cache.get(token)?.file).toBe(file);
    expect(cache.get(token)?.info).toMatchObject({ name: 'cv.pdf', type: 'application/pdf', size: file.size });
  });

  test('rejects files over maxSize without emitting, and shows a local error', async () => {
    const w = mountField({ modelValue: null, maxSize: 2 });
    await selectFiles(w, [makeFile('big.pdf', 'too-big')]);

    expect(w.emitted('update:modelValue')).toBeUndefined();
    expect(w.find('.invalid-feedback').text()).toContain('too large');
  });

  test('rejects files not matching accept', async () => {
    const w = mountField({ modelValue: null, accept: '.pdf' });
    await selectFiles(w, [makeFile('photo.png', 'x', 'image/png')]);

    expect(w.emitted('update:modelValue')).toBeUndefined();
    expect(w.find('.invalid-feedback').text()).toContain('not an accepted file type');
  });

  test('with a value present, shows a remove control and hides the picker (one-way)', async () => {
    cache.put({ token: 'vfmfile_x', name: 'cv.pdf', type: 'application/pdf', size: 4 }, makeFile('cv.pdf'));
    const w = mountField({ modelValue: 'vfmfile_x' });
    await flushPromises();

    expect(w.find('.vfm-file-upload-remove').exists()).toBe(true);
    expect(w.find('input[type="file"]').exists()).toBe(false);
    expect(w.text()).toContain('cv.pdf');
  });

  test('removing clears the value and releases the cache entry', async () => {
    cache.put({ token: 'vfmfile_x', name: 'cv.pdf', type: 'application/pdf', size: 4 }, makeFile('cv.pdf'));
    const w = mountField({ modelValue: 'vfmfile_x' });
    await w.find('.vfm-file-upload-remove').trigger('click');

    expect(lastEmittedValue(w)).toBeNull();
    expect(cache.has('vfmfile_x')).toBe(false);
  });
});

describe('FileUploadField — multiple', () => {
  test('accumulates tokens into an array', async () => {
    const w = mountField({ modelValue: [], multiple: true });
    await selectFiles(w, [makeFile('a.pdf', 'aa')]);
    await w.setProps({ modelValue: lastEmittedValue(w) as string[] });
    await selectFiles(w, [makeFile('b.pdf', 'bbb')]);

    expect(lastEmittedValue(w)).toEqual([`vfmfile_a.pdf_2`, `vfmfile_b.pdf_3`]);
  });

  test('dedupes the same file: one token, one cache entry', async () => {
    const w = mountField({ modelValue: [], multiple: true });
    await selectFiles(w, [makeFile('a.pdf', 'aa')]);
    const afterFirst = lastEmittedValue(w) as string[];
    await w.setProps({ modelValue: afterFirst });
    await selectFiles(w, [makeFile('a.pdf', 'aa')]);

    expect(w.props('modelValue')).toEqual([`vfmfile_a.pdf_2`]);
    expect(cache.has('vfmfile_a.pdf_2')).toBe(true);
  });

  test('enforces maxFiles across a batch selection', async () => {
    // One already attached, limit of 2: a two-file selection should add only the first.
    const w = mountField({ modelValue: ['vfmfile_existing'], multiple: true, maxFiles: 2 });
    await selectFiles(w, [makeFile('a.pdf', 'aa'), makeFile('b.pdf', 'bbb')]);

    expect(lastEmittedValue(w)).toEqual(['vfmfile_existing', 'vfmfile_a.pdf_2']);
    expect(w.find('.invalid-feedback').text()).toContain('at most 2 files');
  });

  test('renders per-file errors at the item index', () => {
    cache.put({ token: 'vfmfile_a', name: 'a.pdf', type: 'application/pdf', size: 2 }, makeFile('a.pdf', 'aa'));
    const w = mountField({ modelValue: ['vfmfile_a'], multiple: true, errors: { '0': ['File rejected by server'] } });
    expect(w.text()).toContain('File rejected by server');
  });
});

describe('FileUploadField — upload mode', () => {
  const makeProvider = (impl: Partial<UploadProvider> = {}): UploadProvider => ({
    upload: vi.fn(),
    ...impl,
  });

  test('uploads via the provider and stores the returned token (no File in cache)', async () => {
    const provider = makeProvider({
      upload: vi.fn(async (_data, cb) => {
        cb(50, 100);
        return { status: 'ok', resource: { token: 'srv-1', name: 'p.png', type: 'image/png', size: 9, url: '/u/srv-1.png' } };
      }),
    });
    const w = mountField({ modelValue: null, mode: 'upload' }, { [injectionSymbols.uploadProvider as symbol]: provider });
    await selectFiles(w, [makeFile('p.png', 'x', 'image/png')]);

    expect(provider.upload).toHaveBeenCalled();
    expect(lastEmittedValue(w)).toBe('srv-1');
    expect(cache.get('srv-1')?.info.url).toBe('/u/srv-1.png');
    expect(cache.get('srv-1')?.file).toBeUndefined();
  });

  test('surfaces provider failures as local errors and does not emit', async () => {
    const provider = makeProvider({
      upload: vi.fn(async () => ({ status: 'fail', errors: { '': ['Server rejected the file'] } })),
    });
    const w = mountField({ modelValue: null, mode: 'upload' }, { [injectionSymbols.uploadProvider as symbol]: provider });
    await selectFiles(w, [makeFile('p.png', 'x', 'image/png')]);

    expect(w.emitted('update:modelValue')).toBeUndefined();
    expect(w.find('.invalid-feedback').text()).toContain('Server rejected the file');
  });
});

describe('FileUploadField — container integration', () => {
  test('the token round-trips through a FieldGroup lens unchanged when a sibling changes', async () => {
    const vals = ref<Record<string, unknown>>({ name: '', cv: null });
    const Parent = defineComponent({
      components: { FieldGroup, FileUploadField },
      setup() {
        provide(injectionSymbols.uploadedFileCache, cache);
        return { vals };
      },
      template: `
        <FieldGroup v-model="vals">
          <FileUploadField name="cv" />
        </FieldGroup>`,
    });
    const w = mount(Parent);
    await selectFiles(w, [makeFile('cv.pdf', 'aa')]);

    const token = `vfmfile_cv.pdf_2`;
    expect(vals.value.cv).toBe(token);

    // Mutating a sibling re-copies the compound value (copyFormValue); the token must survive intact.
    vals.value = { ...vals.value, name: 'Dan' };
    await flushPromises();
    expect(vals.value.cv).toBe(token);
  });
});

describe('useUploadedFiles helpers', () => {
  const callHelper = <T,>(fn: (api: ReturnType<typeof useUploadedFiles>) => T): T => {
    let out!: T;
    const Comp = defineComponent({
      setup() {
        out = fn(useUploadedFiles());
        return () => h('div');
      },
    });
    // Provide at the app level (not in the component's own setup) so the composable's inject sees it.
    mount(Comp, { global: { provide: { [injectionSymbols.uploadedFileCache as symbol]: cache } } });
    return out;
  };

  const seed = () => {
    cache.put({ token: 'vfmfile_a', name: 'a.pdf', type: 'application/pdf', size: 2 }, makeFile('a.pdf', 'aa'));
    cache.put({ token: 'srv-1', name: 'p.png', type: 'image/png', size: 9, url: '/u/srv-1.png' }); // upload mode: no File
  };

  const value = () => ({
    name: 'Dan',
    cv: 'vfmfile_a',
    avatar: 'srv-1',
    refs: [{ letter: 'vfmfile_a' }],
  });

  test('toFormData puts the value JSON under `data` and inline files at path keys', () => {
    seed();
    const fd = callHelper((api) => api.toFormData(value()));

    expect(JSON.parse(fd.get('data') as string)).toEqual(value());
    // Inline file appears once per referencing path (so the server can place each one).
    expect(fd.get('files[cv]')).toBeInstanceOf(File);
    expect(fd.get('files[refs.0.letter]')).toBeInstanceOf(File);
    // Upload-mode token (already on the server) is left in `data` only — no file part.
    expect(fd.get('files[avatar]')).toBeNull();
  });

  test('toJson returns a { data, files } envelope with base64 for inline files only', async () => {
    seed();
    const out = await callHelper((api) => api.toJson(value()));
    const parsed = JSON.parse(out);

    expect(parsed.data).toEqual(value());
    expect(parsed.files['cv']).toEqual({ name: 'a.pdf', type: 'application/pdf', base64_contents: 'b64(a.pdf)' });
    expect(parsed.files['refs.0.letter']).toEqual({ name: 'a.pdf', type: 'application/pdf', base64_contents: 'b64(a.pdf)' });
    expect(parsed.files['avatar']).toBeUndefined();
  });

  test('getFile / release operate on the cache', () => {
    seed();
    callHelper((api) => {
      expect(api.getFile('vfmfile_a')).toBeInstanceOf(File);
      api.release('vfmfile_a');
      return null;
    });
    expect(cache.has('vfmfile_a')).toBe(false);
  });
});

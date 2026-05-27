import type { MediaItem } from '../src/types';

// A MediaItem with sensible defaults. Default is a non-resizable file (pdf) with no thumbnail.
export const makeMediaItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: 1,
  status: 'available',
  title: 'Test file',
  extension: 'pdf',
  src: '/media/1.pdf',
  alt: null,
  src_thumb: null,
  ...overrides,
});

// A resizable image item (has src_thumb, so previews render a thumbnail rather than an icon).
export const makeResizableItem = (overrides: Partial<MediaItem> = {}): MediaItem =>
  makeMediaItem({
    extension: 'jpg',
    src: '/media/1.jpg',
    src_thumb: '/media/1-thumb.jpg',
    ...overrides,
  });

// jsdom can't construct a real FileList, but MediaLibrary guards with `files instanceof FileList`.
// This builds an object that is iterable, indexable, and passes the instanceof check by borrowing
// FileList.prototype. Assign it to a file input via Object.defineProperty(el, 'files', { value }).
export const makeFileList = (files: File[]): FileList => {
  const list: Record<PropertyKey, unknown> = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  };
  files.forEach((f, i) => {
    list[i] = f;
  });
  Object.setPrototypeOf(list, FileList.prototype);
  return list as unknown as FileList;
};

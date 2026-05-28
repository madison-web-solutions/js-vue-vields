import { describe, test, expect } from 'vitest';
import { hasThumbnail, getMediaItemIcon, isImageMediaItem, imageExtensions } from '../src/lib/media';
import { makeMediaItem, makeResizableItem } from './media-utils';

describe('hasThumbnail', () => {
  test('is true when src_thumb is set, false otherwise', () => {
    expect(hasThumbnail(makeResizableItem())).toBe(true);
    expect(hasThumbnail(makeMediaItem({ src_thumb: null }))).toBe(false);
    expect(hasThumbnail(makeMediaItem({ src_thumb: undefined }))).toBe(false);
  });
});

describe('isImageMediaItem', () => {
  test('returns true for each known image extension', () => {
    for (const ext of imageExtensions) {
      expect(isImageMediaItem(makeMediaItem({ extension: ext }))).toBe(true);
    }
  });

  test('is case-insensitive', () => {
    expect(isImageMediaItem(makeMediaItem({ extension: 'JPG' }))).toBe(true);
    expect(isImageMediaItem(makeMediaItem({ extension: 'PNG' }))).toBe(true);
  });

  test('returns false for non-image extensions, even when a thumbnail is supplied', () => {
    expect(isImageMediaItem(makeMediaItem({ extension: 'pdf' }))).toBe(false);
    expect(isImageMediaItem(makeMediaItem({ extension: 'pdf', src_thumb: '/media/1-thumb.jpg' }))).toBe(false);
    expect(isImageMediaItem(makeMediaItem({ extension: 'docx' }))).toBe(false);
    expect(isImageMediaItem(makeMediaItem({ extension: 'zip' }))).toBe(false);
  });
});

describe('getMediaItemIcon', () => {
  test('returns triangleAlert for a missing item (takes precedence over a thumbnail)', () => {
    expect(getMediaItemIcon(makeMediaItem({ status: 'missing' }))).toBe('triangleAlert');
    expect(getMediaItemIcon(makeResizableItem({ status: 'missing' }))).toBe('triangleAlert');
  });

  test('returns null for image extensions, with or without a thumbnail', () => {
    expect(getMediaItemIcon(makeMediaItem({ extension: 'svg', src_thumb: null }))).toBeNull();
    expect(getMediaItemIcon(makeMediaItem({ extension: 'png', src_thumb: null }))).toBeNull();
    expect(getMediaItemIcon(makeResizableItem())).toBeNull();
  });

  test('returns a document icon for non-image extensions even when a thumbnail is supplied (e.g. a PDF with a generated thumbnail)', () => {
    expect(getMediaItemIcon(makeMediaItem({ extension: 'pdf', src_thumb: '/media/1-thumb.jpg' }))).toBe('filePdf');
    expect(getMediaItemIcon(makeMediaItem({ extension: 'docx', src_thumb: '/media/1-thumb.jpg' }))).toBe('fileText');
  });

  test('maps pdf to filePdf', () => {
    expect(getMediaItemIcon(makeMediaItem({ extension: 'pdf', src_thumb: null }))).toBe('filePdf');
  });

  test('maps doc/docx to fileText', () => {
    for (const ext of ['doc', 'docx']) {
      expect(getMediaItemIcon(makeMediaItem({ extension: ext, src_thumb: null }))).toBe('fileText');
    }
  });

  test('maps spreadsheet extensions to fileSpreadsheet', () => {
    for (const ext of ['xls', 'xlsx', 'csv']) {
      expect(getMediaItemIcon(makeMediaItem({ extension: ext, src_thumb: null }))).toBe('fileSpreadsheet');
    }
  });

  test('maps presentation extensions to fileChart', () => {
    for (const ext of ['ppt', 'pptx']) {
      expect(getMediaItemIcon(makeMediaItem({ extension: ext, src_thumb: null }))).toBe('fileChart');
    }
  });

  test('falls back to the generic file icon for unknown extensions', () => {
    expect(getMediaItemIcon(makeMediaItem({ extension: 'zip', src_thumb: null }))).toBe('file');
    expect(getMediaItemIcon(makeMediaItem({ extension: 'txt', src_thumb: null }))).toBe('file');
  });
});

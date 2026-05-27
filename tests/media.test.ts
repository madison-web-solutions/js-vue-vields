import { describe, test, expect } from 'vitest';
import { isMediaItemResizable, getMediaItemIcon } from '../src/lib/media';
import { makeMediaItem, makeResizableItem } from './media-utils';

describe('isMediaItemResizable', () => {
  test('is true when src_thumb is set, false otherwise', () => {
    expect(isMediaItemResizable(makeResizableItem())).toBe(true);
    expect(isMediaItemResizable(makeMediaItem({ src_thumb: null }))).toBe(false);
    expect(isMediaItemResizable(makeMediaItem({ src_thumb: undefined }))).toBe(false);
  });
});

describe('getMediaItemIcon', () => {
  test('returns triangleAlert for a missing item (takes precedence over a thumbnail)', () => {
    expect(getMediaItemIcon(makeMediaItem({ status: 'missing' }))).toBe('triangleAlert');
    expect(getMediaItemIcon(makeResizableItem({ status: 'missing' }))).toBe('triangleAlert');
  });

  test('returns null for svg and for resizable (thumbnailable) items', () => {
    expect(getMediaItemIcon(makeMediaItem({ extension: 'svg', src_thumb: null }))).toBeNull();
    expect(getMediaItemIcon(makeResizableItem())).toBeNull();
  });

  test('returns null for a non-image file that supplies a thumbnail (e.g. a PDF with src_thumb), so the thumbnail is shown instead of the file icon', () => {
    expect(getMediaItemIcon(makeMediaItem({ extension: 'pdf', src_thumb: '/media/1-thumb.jpg' }))).toBeNull();
  });

  test('maps document extensions to fileText', () => {
    for (const ext of ['pdf', 'doc', 'docx']) {
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

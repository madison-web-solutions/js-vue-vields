import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MediaPreview from '../src/components/media/MediaPreview.vue';
import { makeMediaItem, makeResizableItem } from './media-utils';

// MediaPreview is purely presentational: it maps a MediaItem (or null=loading / false=none) to a
// thumbnail-or-icon-or-overlay, an always-on filename caption underneath, and emits
// inspect/remove/select. The overlay icon name is read from the rendered Icon component's `icon`
// prop via findComponent on the overlay icon's class.

const preview = (w: ReturnType<typeof mount>) => w.find('.vfm-media-preview');
const status = (w: ReturnType<typeof mount>) => preview(w).attributes('data-vfm-media-status');
const overlayIconName = (w: ReturnType<typeof mount>) =>
  w.findComponent('.vfm-media-preview-icon').props('icon');
const filename = (w: ReturnType<typeof mount>) => w.find('.vfm-media-preview-filename');

describe('MediaPreview', () => {
  test('item=false renders the none state with no thumbnail and no filename', () => {
    const w = mount(MediaPreview, { props: { item: false } });
    expect(status(w)).toBe('none');
    expect(preview(w).classes()).not.toContain('vfm-has-thumb');
    expect(filename(w).exists()).toBe(false);
  });

  test('item=null renders the loading state with a loader icon and no filename', () => {
    const w = mount(MediaPreview, { props: { item: null } });
    expect(status(w)).toBe('loading');
    expect(w.find('.vfm-media-preview-overlay').exists()).toBe(true);
    expect(overlayIconName(w)).toBe('loaderCircle');
    expect(filename(w).exists()).toBe(false);
  });

  test('a resizable image item shows a thumbnail, no icon overlay, and the filename (with extension) underneath', () => {
    const w = mount(MediaPreview, { props: { item: makeResizableItem({ title: 'My Photo' }) } });
    expect(status(w)).toBe('available');
    expect(preview(w).classes()).toContain('vfm-has-thumb');
    expect(preview(w).attributes('style')).toContain('/media/1-thumb.jpg');
    expect(w.find('.vfm-media-preview-overlay').exists()).toBe(false);
    expect(filename(w).text()).toBe('My Photo.jpg');
    expect(filename(w).attributes('title')).toBe('My Photo.jpg');
  });

  test('an svg item uses its src as the background image', () => {
    const w = mount(MediaPreview, {
      props: { item: makeMediaItem({ extension: 'svg', src: '/media/logo.svg', src_thumb: null }) },
    });
    expect(preview(w).classes()).toContain('vfm-has-thumb');
    expect(preview(w).attributes('style')).toContain('/media/logo.svg');
    expect(w.find('.vfm-media-preview-overlay').exists()).toBe(false);
  });

  test('a non-resizable file shows the file icon and the filename underneath', () => {
    const w = mount(MediaPreview, {
      props: { item: makeMediaItem({ extension: 'pdf', title: 'Report', src_thumb: null }) },
    });
    expect(preview(w).classes()).not.toContain('vfm-has-thumb');
    expect(overlayIconName(w)).toBe('fileText');
    expect(filename(w).text()).toBe('Report.pdf');
  });

  test('a non-image file that supplies a src_thumb shows the thumbnail AND the file icon overlay (so it stays identifiable as a document)', () => {
    const w = mount(MediaPreview, {
      props: { item: makeMediaItem({ extension: 'pdf', title: 'Report', src: '/media/1.pdf', src_thumb: '/media/1-thumb.jpg' }) },
    });
    expect(status(w)).toBe('available');
    expect(preview(w).classes()).toContain('vfm-has-thumb');
    expect(preview(w).attributes('style')).toContain('/media/1-thumb.jpg');
    expect(w.find('.vfm-media-preview-overlay').exists()).toBe(true);
    expect(overlayIconName(w)).toBe('fileText');
    expect(filename(w).text()).toBe('Report.pdf');
  });

  test('a missing item shows the alert icon', () => {
    const w = mount(MediaPreview, {
      props: { item: makeMediaItem({ status: 'missing', src_thumb: null }) },
    });
    expect(status(w)).toBe('missing');
    expect(overlayIconName(w)).toBe('triangleAlert');
  });

  test('an uploading item shows the status in the overlay', () => {
    const w = mount(MediaPreview, { props: { item: makeResizableItem({ status: 'uploading' }) } });
    expect(status(w)).toBe('uploading');
    expect(w.find('.vfm-media-preview-overlay').exists()).toBe(true);
    expect(w.find('.vfm-media-preview-status').text()).toBe('uploading');
  });

  test('inspect and remove buttons emit their events without triggering select', async () => {
    const w = mount(MediaPreview, {
      props: { item: makeResizableItem(), inspectable: true, removable: true },
    });
    await w.find('.vfm-media-preview-inspect').trigger('click');
    expect(w.emitted('inspect')).toBeTruthy();
    expect(w.emitted('select')).toBeFalsy(); // @click.stop prevents the parent select handler

    await w.find('.vfm-media-preview-remove').trigger('click');
    expect(w.emitted('remove')).toBeTruthy();
  });

  test('clicking the preview body emits select', async () => {
    const w = mount(MediaPreview, { props: { item: makeResizableItem() } });
    await preview(w).trigger('click');
    expect(w.emitted('select')).toBeTruthy();
  });

  test('inspect and remove buttons are absent by default', () => {
    const w = mount(MediaPreview, { props: { item: makeResizableItem() } });
    expect(w.find('.vfm-media-preview-inspect').exists()).toBe(false);
    expect(w.find('.vfm-media-preview-remove').exists()).toBe(false);
  });
});

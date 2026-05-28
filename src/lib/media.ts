import type { MediaItem, MediaItemWithThumbnail, IconName } from "../types";

export const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "tif", "tiff", "svg"] as const;

export const isImageMediaItem = (item: MediaItem): boolean => {
  return (imageExtensions as readonly string[]).includes(item.extension.toLowerCase());
};

export const hasThumbnail = (item: MediaItem): item is MediaItemWithThumbnail => {
  return item.src_thumb != null;
};

// Returns the icon name to show for this item, or null when the item is an image
// that should be rendered directly (no overlay icon needed).
export const getMediaItemIcon = (item: MediaItem): IconName | null => {
  if (item.status == "missing") {
    return "triangleAlert";
  }
  if (isImageMediaItem(item)) {
    return null;
  }
  switch (item.extension.toLowerCase()) {
    case "pdf":
      return "filePdf";
    case "doc":
    case "docx":
      return "fileText";
    case "xls":
    case "xlsx":
    case "csv":
      return "fileSpreadsheet";
    case "ppt":
    case "pptx":
      return "fileChart";
    default:
      return "file";
  }
};

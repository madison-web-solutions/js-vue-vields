import type { MediaItem, ResizableMediaItem, IconName } from "../types";

export const isMediaItemResizable = (item: MediaItem): item is ResizableMediaItem => {
  return item.src_thumb != null;
};

// Null is returned when the image or thumbnail can be used instead of an icon
export const getMediaItemIcon = function (item: MediaItem): IconName | null {
  if (item.status == "missing") {
    return "triangleAlert";
  } else if (item.extension == "svg") {
    return null;
  } else if (isMediaItemResizable(item)) {
    return null;
  } else {
    switch (item.extension) {
      case "pdf":
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
  }
};

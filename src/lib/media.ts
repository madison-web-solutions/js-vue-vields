import { ButtonView, icons, ImageUtils, Plugin } from "ckeditor5";
import type { MediaItem, ResizableMediaItem } from "../main";

export const isMediaItemResizable = (
  item: MediaItem,
): item is ResizableMediaItem => {
  return "src_thumb" in item;
};

export const getIconCssClass = function (item: MediaItem): string | null {
  if (item.status == "missing") {
    return "fas fa-exclamation-triangle";
  } else if (item.extension == "svg") {
    return null;
  } else if (isMediaItemResizable(item)) {
    return null;
  } else {
    switch (item.extension) {
      case "pdf":
        return "fas fa-file-pdf";
      case "doc":
      case "docx":
        return "fas fa-file-word";
      case "xls":
      case "xlsx":
        return "fas fa-file-excel";
      case "csv":
        return "fas fa-file-csv";
      case "ppt":
      case "pptx":
        return "fas fa-file-powerpoint";
      default:
        return "fas fa-file";
    }
  }
};

/**
 * Plugin for CkEditor which adds a 'Media Library' button
 * When clicked, the openMediaLibrary callback is called
 * When a media id is passed back to the insertSelectedImage() method, the image is inserted into the editor
 */
export class CkEditorMediaLibraryPlugin extends Plugin {
  openMediaLibrary: undefined | (() => void) = undefined;

  init() {
    const editor = this.editor;
    editor.ui.componentFactory.add("medialibrary", () => {
      const button = new ButtonView();
      button.set({
        label: "Media Library",
        icon: icons.imageAssetManager,
      });
      button.on("execute", () => {
        this.openMediaLibrary && this.openMediaLibrary();
      });
      return button;
    });
    editor.model.schema.extend("imageBlock", {
      allowAttributes: ["data-media-id"],
    });
    editor.model.schema.extend("imageInline", {
      allowAttributes: ["data-media-id"],
    });
    editor.conversion.attributeToAttribute({
      model: "data-media-id",
      view: "data-media-id",
    });
  }

  onOpenMediaLibrary(openMediaLibrary: () => void): void {
    this.openMediaLibrary = openMediaLibrary;
  }

  insertSelectedImage(mediaItem: MediaItem) {
    const editor = this.editor;
    const imageUtils: ImageUtils = editor.plugins.get("ImageUtils");
    if (imageUtils && mediaItem.src) {
      const attrs = {
        src: mediaItem.src,
        alt: mediaItem.alt,
        "data-media-id": String(mediaItem.id),
      };
      imageUtils.insertImage(attrs);
    }
  }
}

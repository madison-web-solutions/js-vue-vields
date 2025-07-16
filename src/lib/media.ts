import { ButtonView, icons, Plugin } from "ckeditor5";
import type { MediaItem, ResizableMediaItem, IconName } from "../types";

export const isMediaItemResizable = (item: MediaItem): item is ResizableMediaItem => {
  return "src_thumb" in item;
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

/**
 * Plugin for CkEditor which adds a 'Media Library' button
 * When clicked, the openMediaLibrary callback is called
 * When a media id is passed back to the insertSelectedImage() method, the image is inserted into the editor
 */
export class CkEditorMediaLibraryPlugin extends Plugin {
  openMediaLibrary: undefined | (() => void) = undefined;

  init() {
    const editor = this.editor;
    editor.ui.componentFactory.add("vfmMedialibrary", () => {
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
    if (editor.plugins.has("ImageUtils") && mediaItem.src) {
      const attrs = {
        src: mediaItem.src,
        alt: mediaItem.alt,
        "data-media-id": String(mediaItem.id),
      };
      editor.plugins.get("ImageUtils").insertImage(attrs);
    }
  }
}

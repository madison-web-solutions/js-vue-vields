import { ButtonView, IconImageAssetManager, Plugin } from "ckeditor5";
import type { MediaItem } from "../types";

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
        icon: IconImageAssetManager,
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

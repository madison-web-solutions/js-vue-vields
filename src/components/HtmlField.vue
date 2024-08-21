<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <div
        ref="editorContainerEle"
        v-pclass="'html-field'"
        :class="{ 'is-invalid': hasError }"
      ></div>
      <Modal
        v-if="choosingImage"
        title="Media Library"
        size="xl"
        @close="choosingImage = false"
      >
        <MediaLibrary
          :standalone="false"
          @select="insertChosenImage"
          @close="choosingImage = false"
        />
      </Modal>
    </template>
    <template #viewMode>
      <div class="card">
        <div v-html="modelValue" class="card-body"></div>
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Paragraph,
  Heading,
  Strikethrough,
  Underline,
  Code,
  Link,
  Subscript,
  Superscript,
  Alignment,
  List,
  CodeBlock,
  BlockQuote,
  HorizontalLine,
  Table,
  EditorConfig,
  Image,
  PluginConstructor,
  Editor,
  ToolbarConfigItem,
  ImageToolbar,
  ImageConfig,
  ImageStyle,
  TableConfig,
} from "ckeditor5";
import type { LookupResult, MediaItem, MessageBag } from "../main";
import { ref, toRefs, watch, onBeforeUnmount, inject } from "vue";
import { symbols, commonProps, getConfigRef, useFormField } from "../main";
import { CkEditorMediaLibraryPlugin } from "../lib/media";
import Modal from "./Modal.vue";
import MediaLibrary from "./media/MediaLibrary.vue";
import "ckeditor5/ckeditor5.css";

const props = defineProps(
  Object.assign({}, commonProps, {
    subSuperScript: {
      type: Boolean,
      required: false,
    },
    code: {
      type: Boolean,
      required: false,
    },
    tables: {
      type: Boolean,
      required: false,
    },
    images: {
      type: Boolean,
      required: false,
    },
  }),
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const enableSubSuperScript = getConfigRef(
  "html.subSuperScript",
  propRefs.subSuperScript,
);
const enableCode = getConfigRef("html.code", propRefs.code);
const enableTables = getConfigRef("html.tables", propRefs.tables);
const enableImages = getConfigRef("html.images", propRefs.images);

const coerceToString = (value: any): string => {
  return value ? String(value) : "";
};

const { modelValue, hasError, FieldWrapper, standardWrapperProps } =
  useFormField<string>(coerceToString, emit, propRefs, {
    fieldTypeSlug: "html",
  });

const INPUT_DEBOUNCE_WAIT: number = 300;

const lastEditorData = ref<string>("");

let editor: ClassicEditor | null = null;

const editorContainerEle = ref<HTMLElement | null>(null);

const mediaProvider = inject(symbols.mediaProvider);

const ckEditorConfig = (): EditorConfig => {
  const plugins: PluginConstructor<Editor>[] = [
    Essentials,
    Bold,
    Italic,
    Paragraph,
    Heading,
    Strikethrough,
    Underline,
    Link,
    Alignment,
    List,
    BlockQuote,
    HorizontalLine,
  ];
  const toolbarGroups: Record<string, ToolbarConfigItem[]> = {
    heading: ["heading"],
    inlineFormat: ["bold", "italic", "strikethrough", "underline", "link"],
    blockFormat: ["alignment", "bulletedList", "blockQuote", "horizontalLine"],
    undo: ["undo", "redo"],
  };
  let imageConfig: ImageConfig | undefined = undefined;
  let tableConfig: TableConfig | undefined = undefined;

  if (enableSubSuperScript.value) {
    plugins.push(Subscript, Superscript);
    toolbarGroups.inlineFormat.push("subscript", "superscript");
  }
  if (enableCode.value) {
    plugins.push(Code, CodeBlock);
    toolbarGroups.inlineFormat.push("code");
    toolbarGroups.blockFormat.push("codeBlock");
  }
  if (enableTables.value) {
    plugins.push(Table);
    toolbarGroups.blockFormat.push("insertTable");
    tableConfig = {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    };
  }
  if (enableImages.value && mediaProvider) {
    plugins.push(Image, ImageToolbar, ImageStyle, CkEditorMediaLibraryPlugin);
    toolbarGroups.media = ["medialibrary"];
    imageConfig = {
      toolbar: [
        "imageTextAlternative",
        "imageStyle:alignBlockLeft",
        "imageStyle:alignBlockRight",
        "imageStyle:block",
        "imageStyle:inline",
      ],
    };
  }

  const toolbarItems: ToolbarConfigItem[] = [];
  Object.values(toolbarGroups).forEach((items, index) => {
    if (index > 0) {
      toolbarItems.push("|");
    }
    toolbarItems.push(...items);
  });

  const config: EditorConfig = {
    plugins: plugins,
    toolbar: {
      items: toolbarItems,
    },
    language: "en",
    table: tableConfig,
    image: imageConfig,
  };

  return config;
};

const choosingImage = ref<boolean>(false);
const insertChosenImage = (mediaId: string | number) => {
  choosingImage.value = false;
  const mlPlugin = editor?.plugins.get(CkEditorMediaLibraryPlugin);
  if (enableImages.value && mediaProvider && mlPlugin) {
    mediaProvider.value
      .lookup(mediaId)
      .then((result: LookupResult<MediaItem>) => {
        if (result.status == "found") {
          mlPlugin.insertSelectedImage(result.resource);
        }
      });
  }
};

const createEditor = () => {
  if (editor == null && editorContainerEle.value != null) {
    const config = ckEditorConfig();
    const editorEle = document.createElement("div");
    editorContainerEle.value.appendChild(editorEle);
    ClassicEditor.create(editorEle, config)
      .then((newEditor) => {
        // Save the reference to the instance for further use.
        editor = newEditor;
        // Set initial disabled state.
        if (props.disabled) {
          editor.enableReadOnlyMode(symbols.htmlEditorLock);
        }
        editor.model.document.on("change:data", handleEditorDataChange);
        editor.setData(modelValue.value || "");
        // Connect the media library ckeditor plugin so that the button opens the MediaLibrary Modal
        const mlPlugin = editor?.plugins.get(CkEditorMediaLibraryPlugin);
        if (enableImages.value && mlPlugin) {
          mlPlugin.onOpenMediaLibrary(() => (choosingImage.value = true));
        }
        // Uncomment to see list of possible toolbar items
        // console.log(Array.from(editor.ui.componentFactory.names()));
      })
      .catch((error: any) => {
        console.error(error.stack);
      });
  }
};

const destroyEditor = () => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
};

let timeoutId: number | undefined = undefined;
const handleEditorDataChange = () => {
  window.clearTimeout(timeoutId);
  if (!editor || props.disabled) {
    return;
  }
  timeoutId = window.setTimeout(() => {
    // Cache the last editor data.
    const data = editor?.getData() || "";
    if (data != lastEditorData.value) {
      lastEditorData.value = data;
      modelValue.value = data;
    }
  }, INPUT_DEBOUNCE_WAIT);
};

watch(modelValue, () => {
  if (editor && lastEditorData.value != modelValue.value) {
    editor.setData(modelValue.value || "");
  }
});

watch(
  () => props.disabled,
  (newVal) => {
    if (editor) {
      if (newVal) {
        editor.enableReadOnlyMode(symbols.htmlEditorLock);
      } else {
        editor.disableReadOnlyMode(symbols.htmlEditorLock);
      }
    }
  },
);

watch(editorContainerEle, () => {
  if (editorContainerEle.value) {
    createEditor();
  } else {
    destroyEditor();
  }
});

onBeforeUnmount(destroyEditor);

const focus = () => {
  editor?.editing?.view?.focus();
};
defineExpose({ focus });
</script>

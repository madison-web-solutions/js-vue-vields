<template>
  <FieldWrapper :field="field">
    <template #input>
      <div ref="editorContainerEle" class="vfm-html-field" :class="{ 'is-invalid': field.hasError }">
        <div ref="editorEle"></div>
      </div>
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
  Image,
  PluginConstructor,
  Editor,
  ToolbarConfigItem,
  ImageToolbar,
  ImageStyle
} from "ckeditor5";
import type { EditorConfig, ImageConfig, TableConfig } from "ckeditor5";
import type { FieldEmitType, FieldProps } from "../types";
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from "vue";
import useFormField from "../lib/useFormField";
import { coerceToString } from "../lib/type-utils";
import "ckeditor5/ckeditor5.css";
import { getConfigRef } from "../lib/config";

const props = withDefaults(defineProps<FieldProps & {
  subSuperScript?: boolean|undefined,
  code?: boolean|undefined,
  tables?: boolean|undefined,
}>(), {
  subSuperScript: undefined,
  code: undefined,
  tables: undefined,
});

const emit = defineEmits<FieldEmitType<string | null>>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper } = useFormField<string | null>(coerceToString, emit, propRefs);

const INPUT_DEBOUNCE_WAIT: number = 300;

const lastEditorData = ref<string>("");

let editor: ClassicEditor | null = null;
let editorLock: symbol | null = null;

const editorContainerEle = ref<HTMLElement | null>(null);
const editorEle = ref<HTMLElement | null>(null);

const enableSubSuperScript = getConfigRef("html.subSuperScript", propRefs.subSuperScript);
const enableCode = getConfigRef("html.code", propRefs.code);
const enableTables = getConfigRef("html.tables", propRefs.tables);

const editorRequired = computed(() => field.value.editMode === 'edit' && editorContainerEle.value != null && editorEle.value != null);

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

  const toolbarItems: ToolbarConfigItem[] = [];
  Object.values(toolbarGroups).forEach((items, index) => {
    if (index > 0) {
      toolbarItems.push("|");
    }
    toolbarItems.push(...items);
  });

  const config: EditorConfig = {
    licenseKey: 'GPL',
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

const createEditor = () => {
  if (editor == null && editorContainerEle.value != null && editorEle.value != null) {
    const config = ckEditorConfig();
    ClassicEditor.create(editorEle.value, config)
      .then((newEditor: ClassicEditor) => {
        // Set initial disabled state.
        editorLock = Symbol();
        if (props.disabled) {
          newEditor.enableReadOnlyMode(editorLock);
        }

        // Binding to data
        newEditor.model.document.on("change:data", handleEditorDataChange);
        newEditor.setData(modelValue.value ?? "");

        // Uncomment to see list of possible toolbar items
        // console.log(Array.from(newEditor.ui.componentFactory.names()));

        editor = newEditor;
      });
  }
};

// Sync changes in editor to modelValue
let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
const handleEditorDataChange = () => {
  clearTimeout(timeoutId);
  if (!editor || props.disabled) {
    return;
  }
  timeoutId = setTimeout(() => {
    // Cache the last editor data.
    const data = editor?.getData() || "";
    if (data != lastEditorData.value) {
      lastEditorData.value = data;
      modelValue.value = data;
    }
  }, INPUT_DEBOUNCE_WAIT);
};

// Sync changes in modelValue to editor
watch(modelValue, () => {
  if (editor && lastEditorData.value != modelValue.value) {
    editor.setData(modelValue.value || "");
  }
});

// Sync disabled state with editor
watch(propRefs.disabled, (newVal) => {
  if (editor && editorLock) {
    if (newVal) {
      editor.enableReadOnlyMode(editorLock);
    } else {
      editor.disableReadOnlyMode(editorLock);
    }
  }
});

const destroyEditor = async () => {
  if (editor) {
    await editor.destroy();
    editor = null;
    editorLock = null;
  }
};

// Create or destroy editor as appropriate
watch(editorRequired, (newVal) => {
  if (newVal) {
    createEditor();
  } else {
    destroyEditor();
  }
});

onBeforeUnmount(async () => {
  await destroyEditor();
});

</script>
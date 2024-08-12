<template>
  <FieldWrapper v-bind="standardWrapperProps">
    <template #input>
      <div
        ref="editorContainerEle"
        v-pclass="'html-field'"
        :class="{ 'is-invalid': hasError }"
      ></div>
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
} from "ckeditor5";
import type { MessageBag } from "../main";
import { ref, toRefs, watch, onBeforeUnmount } from "vue";
import { commonProps, useFormField } from "../main";
import { symbols } from "../lib/symbols";
import "ckeditor5/ckeditor5.css";

const props = defineProps(Object.assign({}, commonProps, {}));

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

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

const ckEditorConfig = () => {
  return {
    plugins: [
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
    ],
    toolbar: {
      items: [
        "heading",
        "|",
        "bold",
        "italic",
        "strikethrough",
        "underline",
        "code",
        "link",
        "subscript",
        "superscript",
        "|",
        "alignment",
        "bulletedList",
        "numberedList",
        "codeBlock",
        "blockQuote",
        "insertTable",
        "horizontalLine",
        "|",
        "undo",
        "redo",
      ],
    },
    language: "en",
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
    width: "auto",
  };
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
        //console.log(Array.from(editor.ui.componentFactory.names()));
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

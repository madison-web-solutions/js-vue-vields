<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div ref="editorContainerEle" class="html-field"></div>
        </template>
        <template #viewMode>{{ modelValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
// I got this file from making a 'custom build' here https://ckeditor.com/ckeditor-5/online-builder/
// Then editing so that it creates and exports the ClassicEditor object
// @todo, we really need to stop relying on these custom builds, they're a complete nuisance
// CKEditor must be built using webpack so I don't think we can build it from source in this project (Vite/Rollup),
// ...but perhaps we could make a separate ms-ckeditor package where we use webpack to build the editor for source according
// to the spec that we want, then include it here? something like that?
// @ts-ignore
import { ClassicEditor } from 'ckeditor';

import type { MessageBag } from '@/main';
import { ref, toRefs, watch, onMounted, onBeforeUnmount } from 'vue';
import { commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';

const props = defineProps(Object.assign({}, commonProps, {}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceToString = (value: any): string => {
    return value ? String(value) : '';
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<string>(coerceToString, emit, propRefs);

const INPUT_DEBOUNCE_WAIT: number = 300;

const lastEditorData = ref<string>('');

let editor: any = null;

const editorContainerEle = ref<HTMLElement | null>(null);

const ckEditorConfig = () => {
    return {
        toolbar: {
            items: [
                'heading', '|',
                'bold', 'italic', 'strikethrough', 'underline', 'code', 'link', 'subscript', 'superscript', '|',
                'alignment', 'bulletedList', 'numberedList', 'codeBlock', 'blockQuote', 'insertTable', 'horizontalLine', '|',
                'undo', 'redo'
            ]
        },
        language: 'en',
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
        },
        width: 'auto'
    };
};

const createEditor = () => {
    if (editor == null && editorContainerEle.value != null) {
    const config = ckEditorConfig();
    const editorEle = document.createElement('div');
    editorContainerEle.value.appendChild(editorEle);
        ClassicEditor.create(editorEle, config).then((newEditor: any) => {
            // Save the reference to the instance for further use.
            editor = newEditor;
            // Set initial disabled state.
            editor.isReadOnly = props.disabled;
            editor.model.document.on('change:data', handleEditorDataChange);
            editor.setData(modelValue.value || '');
            //console.log(Array.from(editor.ui.componentFactory.names()));
        }).catch((error: any) => {
            console.error(error.stack);
        });
    }
};

let timeoutId: number | undefined = undefined;
const handleEditorDataChange = (evt: any) => {
    window.clearTimeout(timeoutId);
    if (! editor || props.disabled) {
        return;
    }
    timeoutId = window.setTimeout(() => {
        // Cache the last editor data.
        const data = editor.getData() || '';
        if (data != lastEditorData.value) {
            lastEditorData.value = data;
            modelValue.value = data;
        }
    }, INPUT_DEBOUNCE_WAIT);
};

watch(modelValue, () => {
    if (editor && lastEditorData.value != modelValue.value) {
        editor.setData(modelValue.value || '');
    }
});

onMounted(() => {
    editor = null
    createEditor();
});

onBeforeUnmount(() => {
    if (editor) {
        editor.destroy();
        editor = null;
    }
});

</script>

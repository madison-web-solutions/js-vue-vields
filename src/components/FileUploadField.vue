<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="vfm-file-upload" :class="{ 'is-invalid': field.hasError }">
        <ul v-if="tokens.length" class="vfm-file-upload-list">
          <li v-for="(token, index) in tokens" :key="token + ':' + index" class="vfm-file-upload-item">
            <span v-if="thumbUrl(token)" class="vfm-file-upload-thumb">
              <img :src="thumbUrl(token)!" :alt="infoFor(token)?.name" />
            </span>
            <span class="vfm-file-upload-meta">
              <span class="vfm-file-upload-name">{{ infoFor(token)?.name ?? token }}</span>
              <span v-if="infoFor(token)" class="vfm-file-upload-size">{{ formatBytes(infoFor(token)!.size) }}</span>
            </span>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger vfm-file-upload-remove"
              :disabled="field.disabled"
              @click="removeAt(index)"
            >
              <Icon icon="x" />
            </button>
            <div v-if="itemErrors(index).length" class="invalid-feedback d-block">
              <div class="error" v-for="msg in itemErrors(index)">{{ msg }}</div>
            </div>
          </li>
        </ul>

        <ul v-if="uploadsInProgress.length" class="vfm-file-upload-uploading">
          <li v-for="item in uploadsInProgress" :key="item.id" class="vfm-file-upload-progress">
            <span class="vfm-file-upload-name">{{ item.name }}</span>
            <progress class="vfm-file-upload-progress-bar" :value="item.progress" max="100" />
          </li>
        </ul>

        <label v-if="canAddMore" class="vfm-file-upload-picker">
          <input
            ref="fileInput"
            type="file"
            class="vfm-file-upload-input"
            :accept="accept"
            :multiple="multiple"
            :disabled="field.disabled"
            @change="onFilesSelected"
          />
          <Icon icon="plus" />
          <span>{{ pickerLabel }}</span>
        </label>

        <div v-if="localErrors.length" class="invalid-feedback d-block">
          <div class="error" v-for="msg in localErrors">{{ msg }}</div>
        </div>
      </div>
    </template>

    <template #viewMode>
      <ul v-if="tokens.length" class="vfm-file-upload-list">
        <li v-for="(token, index) in tokens" :key="token + ':' + index" class="vfm-file-upload-item">
          <a v-if="downloadUrl(token)" :href="downloadUrl(token)!" target="_blank" rel="noopener">{{ infoFor(token)?.name ?? token }}</a>
          <span v-else>{{ infoFor(token)?.name ?? token }}</span>
        </li>
      </ul>
      <span v-else>{{ config.noValueLabel }}</span>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldProps, FieldEmitType, UploadedFileInfo, Config } from "../types";
import { ref, computed, toRefs, inject, reactive, onBeforeUnmount } from "vue";
import useFormField from "../lib/useFormField";
import injectionSymbols from "../lib/injection-symbols";
import { createUploadedFileCache, cacheFile } from "../lib/uploadedFileCache";
import { reindexErrors } from "../lib/message-bag";
import { defaultConfig } from "../lib/config";
import Icon from "./Icon.vue";

type ValueType = string | string[] | null;

const props = defineProps<FieldProps & {
  mode?: "inline" | "upload";
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
}>();

const emit = defineEmits<FieldEmitType<ValueType>>();

const propRefs = toRefs(props);

const coerceFn = (val: unknown): ValueType => {
  if (props.multiple) {
    return Array.isArray(val) ? val.filter((v): v is string => typeof v === "string") : [];
  }
  return typeof val === "string" ? val : null;
};

const { modelValue, errors, field, FieldWrapper } = useFormField<ValueType>(coerceFn, emit, propRefs);

const mode = computed((): "inline" | "upload" => props.mode ?? "inline");

const cache = inject(injectionSymbols.uploadedFileCache, undefined) ?? createUploadedFileCache();
const uploadProvider = inject(injectionSymbols.uploadProvider, undefined);
const configRef = inject(injectionSymbols.config, undefined);
const config = computed((): Config => configRef?.value ?? defaultConfig);

const infoFor = (token: string): UploadedFileInfo | undefined => {
  return cache.get(token)?.info;
};

// The field value is always normalised to a flat list of tokens for rendering, whether it is bound
// as a single token or (when `multiple`) an array.
const tokens = computed((): string[] => {
  const value = modelValue.value;
  if (Array.isArray(value)) {
    return value;
  }
  return value == null || value === "" ? [] : [value];
});

const canAddMore = computed((): boolean => {
  if (props.disabled) {
    return false;
  }
  if (!props.multiple) {
    return tokens.value.length === 0;
  }
  return props.maxFiles == null || tokens.value.length < props.maxFiles;
});

const pickerLabel = computed((): string => {
  return tokens.value.length > 0 ? "Add file" : "Choose file";
});

// --- Selection & validation ---------------------------------------------------------------------

const fileInput = ref<HTMLInputElement | null>(null);
const localErrors = ref<string[]>([]);

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileMatchesAccept = (file: File, accept: string): boolean => {
  const patterns = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (patterns.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return name.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      return type.startsWith(pattern.slice(0, -1));
    }
    return type === pattern;
  });
};

const validateFile = (file: File): string | null => {
  if (props.maxSize != null && file.size > props.maxSize) {
    return `${file.name} is too large (maximum ${formatBytes(props.maxSize)})`;
  }
  if (props.accept && !fileMatchesAccept(file, props.accept)) {
    return `${file.name} is not an accepted file type`;
  }
  return null;
};

type UploadingItem = { id: number; name: string; progress: number };
const uploadsInProgress = ref<UploadingItem[]>([]);
let uploadSeq = 0;

// Resolve a selected File to its token, caching the file/metadata. Returns null (and records a
// local error) if the file fails validation or an upload fails. Does not touch the field value —
// the caller batches the resulting tokens and commits them once (see onFilesSelected), which keeps
// behaviour correct even though the bound value doesn't update between iterations.
const tokenForFile = async (file: File): Promise<string | null> => {
  const validationError = validateFile(file);
  if (validationError) {
    localErrors.value.push(validationError);
    return null;
  }
  if (mode.value === "upload") {
    return uploadFile(file);
  }
  return cacheFile(cache, file);
};

const uploadFile = async (file: File): Promise<string | null> => {
  if (uploadProvider == null) {
    localErrors.value.push("No upload provider is configured");
    return null;
  }
  const item = reactive<UploadingItem>({ id: ++uploadSeq, name: file.name, progress: 0 });
  uploadsInProgress.value.push(item);

  const data = new FormData();
  data.append("file", file);
  data.append("name", file.name);

  try {
    const result = await uploadProvider.upload(data, (loaded: number, total: number) => {
      item.progress = total ? Math.round((100 * loaded) / total) : 0;
    });
    if (result.status === "ok") {
      cache.put(result.resource);
      return result.resource.token;
    }
    localErrors.value.push(...Object.values(result.errors).flat());
    return null;
  } finally {
    uploadsInProgress.value = uploadsInProgress.value.filter((u) => u.id !== item.id);
  }
};

const onFilesSelected = async (): Promise<void> => {
  const fileList = fileInput.value?.files;
  if (fileList == null) {
    return;
  }
  const selected = Array.from(fileList);
  // Reset the native input so selecting the same file again still fires `change`.
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  localErrors.value = [];

  if (!props.multiple) {
    const file = selected[0];
    if (file == null) {
      return;
    }
    const token = await tokenForFile(file);
    if (token == null) {
      return;
    }
    const previous = typeof modelValue.value === "string" ? modelValue.value : null;
    modelValue.value = token;
    if (previous && previous !== token && mode.value === "inline") {
      cache.release(previous);
    }
    return;
  }

  // Batch: count maxFiles and dedupe against the running result, since the bound value won't
  // update until after this handler returns.
  const existing = Array.isArray(modelValue.value) ? modelValue.value.slice() : [];
  const toAdd: string[] = [];
  for (const file of selected) {
    if (props.maxFiles != null && existing.length + toAdd.length >= props.maxFiles) {
      localErrors.value.push(`You can upload at most ${props.maxFiles} file${props.maxFiles === 1 ? "" : "s"}`);
      break;
    }
    const token = await tokenForFile(file);
    if (token == null || existing.includes(token) || toAdd.includes(token)) {
      continue; // skip invalid uploads and duplicate (content-identical) files
    }
    toAdd.push(token);
  }
  if (toAdd.length > 0) {
    modelValue.value = existing.concat(toAdd);
  }
};

// --- Removal ------------------------------------------------------------------------------------

const removeAt = (index: number): void => {
  const token = tokens.value[index];
  let remaining: string[];
  if (props.multiple) {
    const next = (Array.isArray(modelValue.value) ? modelValue.value : []).slice();
    next.splice(index, 1);
    modelValue.value = next;
    remaining = next;
    // Keep per-file (item-level) error indexes aligned with the shortened value array.
    errors.value = reindexErrors(errors.value, (oldIndex) => {
      if (oldIndex === index) {
        return undefined;
      }
      return oldIndex > index ? oldIndex - 1 : oldIndex;
    });
  } else {
    modelValue.value = null;
    remaining = [];
  }
  // Release the cached file unless another token in this field still references it (content-hash
  // tokens can legitimately repeat). Cross-field sharing is rare and left to the page lifecycle.
  if (token && mode.value === "inline" && !remaining.includes(token)) {
    cache.release(token);
  }
};

// --- Per-file errors ----------------------------------------------------------------------------

// In `multiple` mode each token's position is its error key (errors at "0" belong to the first
// file). The whole-field errors (the "" key) are rendered by the FieldWrapper.
const itemErrors = (index: number): string[] => {
  return props.multiple ? errors.value[index] ?? [] : [];
};

// --- Previews -----------------------------------------------------------------------------------

const objectUrls = new Map<string, string>();

const thumbUrl = (token: string): string | null => {
  const entry = cache.get(token);
  if (entry == null) {
    return null;
  }
  if (entry.info.url && entry.info.type.startsWith("image/")) {
    return entry.info.url;
  }
  if (entry.file && entry.file.type.startsWith("image/") && typeof URL.createObjectURL === "function") {
    if (!objectUrls.has(token)) {
      objectUrls.set(token, URL.createObjectURL(entry.file));
    }
    return objectUrls.get(token) ?? null;
  }
  return null;
};

const downloadUrl = (token: string): string | null => {
  const entry = cache.get(token);
  return entry?.info.url ?? thumbUrl(token);
};

onBeforeUnmount(() => {
  if (typeof URL.revokeObjectURL === "function") {
    for (const url of objectUrls.values()) {
      URL.revokeObjectURL(url);
    }
  }
});
</script>

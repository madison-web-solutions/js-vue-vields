<template>
  <div>
    <div v-if="mode == 'library'" class="row g-3">
      <div v-if="!standalone" class="col-12" data-name="back">
        <a href="#" @click.prevent="emit('close')"><i class="fas fa-long-arrow-alt-left"></i> Back</a>
      </div>
      <div class="col-6">
        <input class="form-control" type="text" placeholder="Search" v-model="searchText" />
      </div>
      <div class="vfm-media-upload-form col-6">
        <label class="btn btn-primary w-100">
          <input ref="fileInput" type="file" multiple @change="fileSelected" />
          <Icon icon="upload" class="me-2" /> Upload Files
        </label>
      </div>
      <div class="col-12">
        <div class="vfm-media-preview-list row g-2" @scroll="handleScroll">
          <div v-for="upload in uploads" class="col-auto">
            <div class="vfm-media-preview" :data-upload-status="upload.status">
              <p v-if="upload.status == 'new'" class="vfm-upload-status">Queued</p>
              <p v-if="upload.status == 'uploading'" class="vfm-upload-status">{{ upload.progress }}%</p>
              <p v-if="upload.status == 'error'" class="vfm-upload-status">{{ messageBagToString(upload.errors) }}</p>
            </div>
          </div>
          <div v-for="item in itemsToShow" :key="item.id" class="col-auto">
            <MediaPreview :item="item" @select="selectAttachment(item.id)" />
          </div>
          <div v-if="canFetchMore" class="col-auto">
            <button class="btn btn-link" @click="fetchNextPage">more...</button>
          </div>
        </div>
      </div>
    </div>
    <MediaDetails
      v-if="mode == 'details' && selectedItemId"
      :itemId="selectedItemId"
      :editable="true"
      :deletable="true"
      @close="deselectAttachment"
      @delete="deleteSelectedAttachment"
    />
  </div>
</template>

<script setup lang="ts">
import type {MessageBag, MediaItem, SearchResultPage, UpdateResult} from "../../types";
import { computed, inject, onMounted, ref } from "vue";
import MediaPreview from "./MediaPreview.vue";
import MediaDetails from "./MediaDetails.vue";
import { messageBagToString } from "../../lib/message-bag";
import useSearches from "../../lib/useSearches";
import injectionSymbols from "../../lib/injection-symbols";
import Icon from "../Icon.vue";

const props = defineProps<{
  standalone?: boolean;
  extraParams?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "select", mediaId: number | string): void;
  (e: "remove"): void;
  (e: "close"): void;
}>();

type UploadAttempt = {
  file: File;
  title: string;
  status: "new" | "uploading" | "error";
  progress: number;
  errors: MessageBag;
};

const provider = inject(injectionSymbols.mediaProvider);

const fileInput = ref<HTMLInputElement | null>(null);

const mode = ref<"library" | "details">("library");
const selectedItemId = ref<string | number | undefined>(undefined);
const uploading = ref<boolean>(false);
const uploads = ref<UploadAttempt[]>([]);
const uploadsCount = ref<number>(0);

const searchFn = (page: number): Promise<SearchResultPage<MediaItem>> | null => {
  if (!provider) {
    return null;
  }
  return provider.search(searchText.value, page, props.extraParams || {});
};

const { searchText, suggestions, canFetchMore, fetchFirstPage, fetchNextPage } = useSearches<MediaItem>(searchFn);

onMounted(() => {
  // Fetch first page immediately
  fetchFirstPage();
});

// Fetch the next page of results when the user scrolls to the bottom of the search results
const handleScroll = (e: Event) => {
  if (canFetchMore.value) {
    const ele = e.target as HTMLElement;
    const scrollProportion =
      (ele.scrollTop + ele.offsetHeight) / ele.scrollHeight;
    if (scrollProportion > 0.9) {
      fetchNextPage();
    }
  }
};

const selectAttachment = (mediaId: number | string) => {
  if (props.standalone) {
    selectedItemId.value = mediaId;
    mode.value = "details";
  } else {
    emit("select", mediaId);
  }
};

const deselectAttachment = () => {
  mode.value = "library";
  selectedItemId.value = undefined;
};

const uploadedItems = ref<MediaItem[]>([]);
const deletedItemIds = ref<(string | number)[]>([]);

const itemsToShow = computed((): MediaItem[] => {
  return uploadedItems.value
    .concat(suggestions.value)
    .filter((item) => !deletedItemIds.value.includes(item.id));
});

const deleteSelectedAttachment = () => {
  if (provider && selectedItemId.value != null) {
    const itemIdToDelete: number | string = selectedItemId.value;
    provider.delete(itemIdToDelete).then((result: boolean) => {
      if (result) {
        deletedItemIds.value.push(itemIdToDelete);
        mode.value = "library";
        selectedItemId.value = undefined;
      } else {
        // delete failed for some reason
        // @todo not sure what to do here
      }
    });
  }
};

const fileSelected = () => {
  const files: FileList | null | undefined = fileInput.value?.files;
  if (files instanceof FileList) {
    for (const file of files) {
      uploads.value.unshift({
        file: file,
        title: file.name.split(".").slice(0, -1).join(".").substring(0, 64),
        status: "new",
        progress: 0,
        errors: {},
      });
      uploadsCount.value++;
    }
    next();
  }
};

const next = () => {
  if (uploading.value) {
    return;
  }
  let nextUpload: UploadAttempt | undefined = undefined;
  for (var i = uploads.value.length - 1; i >= 0; i--) {
    if (uploads.value[i].status == "new") {
      nextUpload = uploads.value[i];
      break;
    }
  }
  if (nextUpload) {
    createFile(nextUpload);
  }
};

const createFile = (upload: UploadAttempt) => {
  if (provider == null) {
    throw "Media provier is not present";
  }
  const data = new FormData();
  data.append("file", upload.file);
  data.append("title", upload.title);

  provider
    .upload(data, (loaded: number, total: number) => {
      upload.progress = Math.round((100 * loaded) / total);
    })
    .then((result: UpdateResult<MediaItem>) => {
      if (result.status == "ok") {
        uploadComplete(upload, result.resource);
      } else {
        uploadFailed(upload, result.errors);
      }
    });
  upload.status = "uploading";
};

const uploadComplete = (upload: UploadAttempt, item: MediaItem) => {
  uploadedItems.value.push(item);
  const index = uploads.value.indexOf(upload);
  uploads.value.splice(index, 1);
  uploading.value = false;
  if (!props.standalone && uploadsCount.value == 1) {
    // There has only ever been a single upload, and it is now finished
    // so assume the intention is to select this file
    emit("select", item.id);
  } else {
    next();
  }
};

const uploadFailed = (upload: UploadAttempt, errors: MessageBag) => {
  upload.status = "error";
  upload.errors = errors;
  uploading.value = false;
  next();
};
</script>

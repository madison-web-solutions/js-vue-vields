<template>
    <div>
        <div v-if="mode == 'library'">
            <div class="media-upload-form mb-3">
                <label class="btn btn-progress">
                    <input ref="fileInput" type="file" multiple @change="fileSelected" />
                    Upload Files
                </label>
            </div>
            <div class="media-preview-list row g-2">
                <div v-for="upload in uploads" class="col-auto">
                    <div class="media-preview" :data-upload-status="upload.status">
                        <p v-if="upload.status == 'new'" class="upload-status">Queued</p>
                        <p v-if="upload.status == 'uploading'" class="upload-status">{{ upload.progress }}%</p>
                        <p v-if="upload.status == 'error'" class="upload-status">{{ messageBagToString(upload.errors) }}</p>
                    </div>
                </div>
                <div v-for="itemId in itemIds" :key="itemId" class="col-auto">
                    <MediaPreview :itemId="itemId" @select="selectAttachment(itemId)" />
                </div>
            </div>
        </div>
        <MediaDetails v-if="mode == 'details' && selectedItemId" :itemId="selectedItemId" :editable="true" :deletable="true" @close="deselectAttachment" @delete="deleteSelectedAttachment" />
    </div>
</template>

<script setup lang="ts">
import type { MessageBag, MediaItem, SearchResultPage, UpdateResult } from '@/main';
import { computed, inject, ref } from 'vue';
import { MediaPreview, MediaDetails, messageBagToString, useSearches, symbols } from '@/main';

const props = defineProps({
    standalone: {
        type: Boolean,
        default: false
    },
    extraParams: {
        type: Object,
        required: false,
    }
});

const emit = defineEmits<{
    (e: 'select', mediaId: number | string): void,
    (e: 'remove'): void,
    (e: 'moveLeft'): void,
    (e: 'moveRight'): void,
    (e: 'select'): void,
}>();

type UploadAttempt = {
    file: File,
    title: string,
    status: 'new' | 'uploading' | 'error',
    progress: number,
    errors: MessageBag,
};

const provider = inject(symbols.mediaProvider);

const fileInput = ref<HTMLInputElement | null>(null);

const mode = ref<'library' | 'details'>('library');
const loading = ref<boolean>(true);
const itemIds = ref<(string | number)[]>([1,2,3,4,5,6,7,8]); // @todo fix this nonsense
// I think perhaps we should pass the MediaItem object to MediaPreview instead of the id
// then it can be used directly with the search suggestions
const selectedItemId = ref<string | number | undefined>(undefined);
const uploading = ref<boolean>(false);
const uploads = ref<UploadAttempt[]>([]);
const uploadsCount = ref<number>(0);


const searchFn = (page: number): Promise<SearchResultPage<MediaItem>> => {
    if (provider) {
        return provider.value.search('', page, {});
    } else {
        return new Promise((resolve, reject) => {
            resolve({page: page, hasMore: false, suggestions: []});
        });
    }
};

const { fetchedPages, suggestions, lastPage, hasMore, searchingId, noResults, canFetchMore, doSearch, fetchFirstPage, fetchNextPage } = useSearches<MediaItem>(searchFn);

// Fetch the next page of results when the user scrolls to the bottom of the search results
const handleScroll = (e: Event) => {
    if (canFetchMore.value) {
        const ele = e.target as HTMLElement;
        const scrollProportion = ((ele.scrollTop + ele.offsetHeight) / ele.scrollHeight);
        if (scrollProportion > 0.9) {
            fetchNextPage();
        }
    }
};


const selectAttachment = (mediaId: number | string) => {
    if (props.standalone) {
        selectedItemId.value = mediaId;
        mode.value = 'details';
    } else {
        emit('select', mediaId);
    }
};

const deselectAttachment = () => {
    mode.value = 'library';
    selectedItemId.value = undefined;
};

const deleteSelectedAttachment = () => {
    if (provider && provider.value && selectedItemId.value != null) {
        const itemIdToDelete: number | string = selectedItemId.value;
        provider.value.delete(itemIdToDelete).then(() => {
            selectedItemId.value = undefined;
            mode.value = 'library';
            const index = itemIds.value.indexOf(itemIdToDelete);
            if (index > -1) {
                itemIds.value.splice(index, 1);
            }
            // refresh(); // @todo not sure about this?
        });
    }
};

const fileSelected = () => {
    const files: FileList | null | undefined = fileInput.value?.files;
    if (files instanceof FileList) {
        for (const file of files) {
            uploads.value.unshift({
                file: file,
                title: file.name.split('.').slice(0, -1).join('.').substring(0, 64),
                status: 'new',
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
        if (uploads.value[i].status == 'new') {
            nextUpload = uploads.value[i];
            break;
        }
    }
    if (nextUpload) {
        createFile(nextUpload);
    }
};

const createFile = (upload: UploadAttempt) => {
    if (provider == null || provider.value == null) {
        throw "Media provier is not present";
    }
    const data = new FormData();
    data.append('file', upload.file);
    data.append('title', upload.title);

    provider.value.upload(data, (loaded: number, total: number) => {
        upload.progress = Math.round(100 * loaded / total);
    }).then((result: UpdateResult<MediaItem>) => {
        if (result.status == 'ok') {
            uploadComplete(upload, result.resource);
        } else {
            uploadFailed(upload, result.errors);
        }
    });
    upload.status = 'uploading';
};

const uploadComplete = (upload: UploadAttempt, item: MediaItem) => {
    //this.$hub.cacheResources(attachment);
    itemIds.value.unshift(item.id);
    const index = uploads.value.indexOf(upload);
    uploads.value.splice(index, 1);
    uploading.value = false;
    if (! props.standalone && uploadsCount.value == 1) {
        // There has only ever been a single upload, and it is now finished
        // so assume the intention is to select this file
        emit('select', item.id);
    } else {
        next();
    }
};


const uploadFailed = (upload: UploadAttempt, errors: MessageBag) => {
    upload.status = 'error';
    upload.errors = errors;
    uploading.value = false;
    next();
};
</script>
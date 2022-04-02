<template>
    <div>
        <div v-if="mode == 'library'">
            <div class="attachment-upload-form mb-3">
                <label class="btn btn-progress">
                    <input ref="fileInput" type="file" multiple @change="fileSelected" />
                    Upload Public Files
                </label>
            </div>
            <div v-if="hasUploadValidationErrors" class="invalid-feedback d-block">
                <template v-for="msgs, key in uploadValidationErrors">
                    <div class="error" v-for="msg in msgs">{{ key }}: {{ msg }}</div>
                </template>
            </div>
            <div class="attachment-list">
                <div v-for="upload in uploads" class="attachment-preview" :data-upload-status="upload.status">
                    <p v-if="upload.status == 'new'" class="upload-status">Queued</p>
                    <p v-if="upload.status == 'uploading'" class="upload-status">{{ upload.progress }}%</p>
                    <p v-if="upload.status == 'error'" class="upload-status">Error: {{ upload.error }}</p>
                </div>
                <MediaPreview v-for="itemId in itemIds" :key="itemId" :itemId="itemId" @select="selectAttachment(itemId)" />
            </div>
        </div>
        <MediaDetails v-if="mode == 'details' && selectedItemId" :itemId="selectedItemId" :editable="true" :deletable="true" @close="deselectAttachment" @delete="deleteSelectedAttachment" />
    </div>
</template>

<script setup lang="ts">
import type { MessageBag, MediaItem, SearchResultPage } from '@/main';
import { computed, inject, ref } from 'vue';
import { MediaPreview, MediaDetails, symbols } from '@/main';

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
    error?: string,
};

const provider = inject(symbols.mediaProvider);

const fileInput = ref<HTMLInputElement | null>(null);

const mode = ref<'library' | 'details'>('library');
const loading = ref<boolean>(true);
const itemIds = ref<(string | number)[]>([1,2,3,4,5,6,7,8]);
const selectedItemId = ref<string | number | undefined>(undefined);
const uploading = ref<boolean>(false);
const uploads = ref<UploadAttempt[]>([]);
const uploadsCount = ref<number>(0);
const uploadValidationErrors = ref<MessageBag>({});

const hasUploadValidationErrors = computed((): boolean => {
    for (const [key, msgs] of Object.entries(uploadValidationErrors.value)) {
        if (msgs.length > 0) {
            return true;
        }
    }
    return false;
});








// Array of search result pages fetched so far.  Null means we haven't searched for anything.
const fetchedPages = ref<SearchResultPage<MediaItem>[] | null>(null);

// Array of all the suggestions fetched so for.
const suggestions = computed((): MediaItem[] => {
    const out: MediaItem[] = [];
    if (fetchedPages.value != null) {
        for (const result of fetchedPages.value) {
            out.push(...result.suggestions);
        }
    }
    return out;
});

// Page number of the most recently fetched page of search results, or zero if we haven't searched for anything
const lastPage = computed((): number => {
    if (fetchedPages.value == null) {
        return 0;
    } else {
        return fetchedPages.value[fetchedPages.value.length - 1].page;
    }
});

// Are there more results available for the current search (or false if we haven't searched for anything)
const hasMore = computed((): boolean => {
    if (fetchedPages.value == null) {
        return false;
    } else {
        return fetchedPages.value[fetchedPages.value.length - 1].hasMore;
    }
});

// Unique id number of the search request that we are currently waiting for (or null if we are not searching at the moment)
const searchingId = ref<number | null>(null);

// Should we show the 'no results' message?  This should be shown, if we have done a search and received the results, and the results were empty
const noResults = computed((): boolean => {
    return fetchedPages.value != null && suggestions.value.length == 0;
});

// Can we fetch additional results for the current search text?  True if the previous results page says there are more available, and we are not already searching
const canFetchMore = computed((): boolean => {
    return hasMore.value && searchingId.value == null;
});

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

const fetchNextPage = () => {
    doSearch('' /* searchText.value */, lastPage.value + 1);
};

let searchCount: number = 1;
const doSearch = (searchTextValue: string, page: number) => {
    if (! provider) {
        return;
    }
    const searchId = searchCount++;
    searchingId.value = searchId;
    provider.value.search('' /* searchtext */, 1 /* page */, props.extraParams).then((searchResultPage: SearchResultPage<MediaItem>) => {
        if (searchingId.value === searchId) {
            // only act on the results if this is still the most recent search operation
            if (fetchedPages.value == null) {
                fetchedPages.value = [];
            }
            fetchedPages.value.push(searchResultPage);
            searchingId.value = null;
        }
    }, (error) => {
        console.log(error);
    });
};
doSearch('', 1);




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
        }, (error) => {
            // @todo what?
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
    }).then((item: MediaItem) => {
        uploadComplete(upload, item);
    }, (error) => {
        /* @todo
        console.log(err);
        var msg = 'Upload error';
        if (err.response.status == 422) {
            msg = 'Invalid upload';
            var validationErrors = util.get(err, 'response.data.errors');
            if (validationErrors) {
                this.uploadValidationErrors.push(validationErrors);
            }
        }
        if (err.response.status == 403) {
            msg = 'Permission Denied';
        }
        if (err.response.status == 413) {
            msg = 'File too large';
        }
        */
        uploadFailed(upload, error);
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


const uploadFailed = (upload: UploadAttempt, errorMsg: string) => {
    upload.status = 'error';
    upload.error = errorMsg;
    uploading.value = false;
    next();
};
</script>
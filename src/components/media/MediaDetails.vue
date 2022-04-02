<template>
    <div class="media-details">
        <div class="row g-2">
            <div class="col-12" data-name="back">
                <a href="#" @click.prevent="emit('close')"><i class="fas fa-long-arrow-alt-left"></i> Back</a>
            </div>
            <div class="col-8" data-name="preview">
                <img v-if="imageSrc" :src="imageSrc" />
                <div v-if="iconCssClass" class="media-details-overlay">
                    <i class="media-details-icon" :class="iconCssClass"></i>
                </div>
            </div>
            <div class="col-4" data-name="details">
                <p><strong>Status:</strong> {{ status }}</p>
                <p v-if="imgWidth && imgHeight"><strong>Dimensions:</strong> {{ imgWidth }}px x {{ imgHeight }}px</p>
                <FieldGroup v-model="vals" v-model:errors="errors">
                    <TextField label="Title" name="title" :disabled="! editable" class="mb-2" />
                    <TextField label="Alt" name="alt" :disabled="! editable" class="mb-2" />
                </FieldGroup>
                <div class="mb-2">
                    <button v-if="deletable" type="button" class="btn btn-link text-danger" @click.stop="emit('delete')">Delete</button>
                </div>
                <div class="mb-2">
                    <button v-if="editable && isDirty" type="button" @click.stop="saveUpdates" class="btn btn-progress">Save Changes</button>
                </div>
            </div>
            <div class="col-12" data-name="url">
                URL:
                <a v-if="item && item.src" :href="item.src" target="_blank">{{ item.src }}</a>
                <span v-if="item && !item.src" class="text-danger">Error - File not found</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MediaItem } from '@/main';
import { computed, ref, inject, watchEffect } from 'vue';
import { getIconCssClass } from '@/lib/media';
import { symbols, FieldGroup, TextField } from '@/main';

const props = defineProps({
    itemId: {
        type: [Number, String],
        required: true,
    },
    editable: {
        type: Boolean,
        default: false
    },
    deletable: {
        type: Boolean,
        default: false
    },
});

const emit = defineEmits<{
    (e: 'close'): void,
    (e: 'delete'): void,
}>();

type MediaVals = {
    title: string,
    alt: string,
};

const vals = ref<MediaVals>({title: '', alt: ''});
const errors = ref({});
const imgWidth = ref<number | undefined>(undefined);
const imgHeight = ref<number | undefined>(undefined);

const provider = inject(symbols.mediaProvider);

const loadStatus = ref<'loading' | 'missing' | 'error' | 'loaded'>('loading');
const item = ref<MediaItem | null>();

watchEffect(() => {
    item.value = null;
    loadStatus.value = 'loading';
    if (provider != null) {
        provider.value.lookup(props.itemId).then((result: MediaItem | null) => {
            if (result == null) {
                loadStatus.value = 'missing';
            } else {
                item.value = result;
                loadStatus.value = 'loaded';
                reset();
            }
        }, (error) => {
            console.log(error);
            loadStatus.value = 'error';
        })
    }
});

const status = computed((): 'loading' | 'missing' | 'error' | 'loaded' | 'uploading' | 'available' => {
    if (item.value == null) {
        return loadStatus.value;
    } else {
        return item.value.status;
    }
});

const sourceVals = computed((): MediaVals => {
    return {
        title: item.value?.title || '',
        alt: item.value?.alt || '',
    };
});

const isDirty = computed((): boolean => {
    return vals.value.title != sourceVals.value.title || vals.value.alt != sourceVals.value.alt;
});

const reset = () => {
    vals.value = {
        title: sourceVals.value.title,
        alt: sourceVals.value.alt,
    };
};

const isImage = computed((): boolean => {
    switch (item.value?.extension || 'none') {
        case 'jpg': case 'jpeg': case 'png': case 'tif': case 'tiff': case 'gif': case 'webp': case 'svg':
            return true;
    }
    return false;
});

const imageSrc = computed((): string | undefined => {
    if (item.value && isImage.value && item.value.src) {
        return item.value.src;
    } else {
        return undefined;
    }
});

const iconCssClass = computed((): string | null => {
    if (item.value == null) {
        if (status.value == 'loading') {
            return 'fas fa-spinner';
        } else {
            return 'fas fa-exclamation-triangle';
        }
    } else {
        return getIconCssClass(item.value);
    }
});

const imageWithDimensionsUrl = computed((): string | undefined => {
    return (imageSrc.value && item.value?.extension != 'svg') ? imageSrc.value : undefined;
});

watchEffect(() => {
    imgWidth.value = undefined;
    imgHeight.value = undefined;
    if (imageWithDimensionsUrl.value != null) {
        const img = new Image();
        img.onload = () => {
            imgWidth.value = img.width;
            imgHeight.value = img.height;
        };
        img.src = imageWithDimensionsUrl.value;
    }
});

const saveUpdates = () => {
    errors.value = {};
    if (provider != null) {
        provider.value.update(props.itemId, vals.value).then((result: MediaItem) => {
            item.value = result;
            reset();
        }, (errors) => {
            errors.value = errors;
        })
    }
};

</script>
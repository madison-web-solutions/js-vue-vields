<template>
    <div v-pclass="{'media-preview': true, 'has-thumb': (backgroundImage != null)}" :style="style" @click="select">
        <div v-pclass="'media-preview-overlay'" v-if="showOverlay">
            <i v-if="iconCssClass" v-pclass="'media-preview-icon'" :class="iconCssClass"></i>
            <div v-if="item != null && backgroundImage == null" v-pclass="'media-preview-title'">{{ item.title }}</div>
            <div v-if="status != 'available'" v-pclass="'media-preview-status'">{{ status }}</div>
        </div>
        <button v-if="inspectable" type="button" v-pclass="'media-preview-inspect'" class="btn btn-sm btn-secondary" @click.stop="emit('inspect')"><i class="fas fa-search"></i></button>
        <button v-if="removable" type="button" v-pclass="'media-preview-remove'" class="btn btn-sm btn-danger" @click.stop="emit('remove')"><i class="fas fa-times"></i></button>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { MediaItem, LookupResult } from '@/main';
import { ref, computed, inject, watchEffect, toRef } from 'vue';
import { symbols } from '@/main';
import { isMediaItemResizable, getIconCssClass } from '@/lib/media';

const props = defineProps({
    item: {
        type: Object as PropType<MediaItem>,
        required: false
    },
    inspectable: {
        type: Boolean,
        default: false,
    },
    removable: {
        type: Boolean,
        default: false,
    },
});

const item = toRef(props, 'item');

const emit = defineEmits<{
    (e: 'inspect'): void,
    (e: 'remove'): void,
    (e: 'select'): void,
}>();

const provider = inject(symbols.mediaProvider);

//const loadStatus = ref<'loading' | 'missing' | 'error' | 'loaded'>('loading');

/*
watchEffect(() => {
    item.value = null;
    loadStatus.value = 'loading';
    if (provider != null) {
        provider.value.lookup(props.itemId).then((result: LookupResult<MediaItem>) => {
            if (result.status == 'found') {
                item.value = result.resource;
                loadStatus.value = 'loaded';
            } else {
                loadStatus.value = 'missing';
            }
        });
    }
});
*/

const status = computed((): 'loading' | 'missing' | 'error' | 'loaded' | 'uploading' | 'available' => {
    if (item.value == null) {
        return 'loading'; // loadStatus.value;
    } else {
        return item.value.status;
    }
});

const backgroundImage = computed((): string | null => {
    if (item.value == null) {
        return null;
    } else if (isMediaItemResizable(item.value)) {
        return item.value.src_thumb;
    } else if (item.value.extension == 'svg' && item.value.src != null) {
        return item.value.src;
    } else {
        return null;
    }
});

const style = computed(() => {
    const style: {[key: string]: string}  = {};
    if (backgroundImage.value != null) {
        style.backgroundImage = 'url('+backgroundImage.value+')';
    }
    return style;
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

const showOverlay = computed((): boolean => {
    return status.value != 'available' || backgroundImage.value == null || iconCssClass.value != null;
});

const select = () => {
    emit('select');
};
</script>

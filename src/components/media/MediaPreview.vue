<template>
    <div class="media-preview" :class="cssClasses" :style="style" @click="select">
        <div class="media-preview-overlay" v-if="showOverlay">
            <i v-if="iconCssClass" class="media-preview-icon" :class="iconCssClass"></i>
            <div v-if="item != null && backgroundImage == null" class="media-preview-title">{{ item.title }}</div>
            <div v-if="status != 'available'" class="media-preview-status">{{ status }}</div>
        </div>
        <button v-if="inspectable" type="button" class="media-preview-inspect" @click.stop="emit('inspect')"><i class="fas fa-search"></i></button>
        <button v-if="removable" type="button" class="media-preview-remove" @click.stop="emit('remove')"><i class="fas fa-times"></i></button>
        <button v-if="movable" type="button" class="media-preview-move-left" @click.stop="emit('moveLeft')"><i class="fas fa-angle-left"></i></button>
        <button v-if="movable" type="button" class="media-preview-move-right" @click.stop="emit('moveRight')"><i class="fas fa-angle-right"></i></button>
    </div>
</template>

<script setup lang="ts">
import type { MediaItem, LookupResult } from '@/main';
import { ref, computed, inject, watchEffect } from 'vue';
import { symbols } from '@/main';
import { isMediaItemResizable, getIconCssClass } from '@/lib/media';

const props = defineProps({
    itemId: {
        type: [Number, String],
        required: true
    },
    inspectable: {
        type: Boolean,
        default: false,
    },
    movable: {
        type: Boolean,
        default: false,
    },
    removable: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits<{
    (e: 'inspect'): void,
    (e: 'remove'): void,
    (e: 'moveLeft'): void,
    (e: 'moveRight'): void,
    (e: 'select'): void,
}>();

const provider = inject(symbols.mediaProvider);

const loadStatus = ref<'loading' | 'missing' | 'error' | 'loaded'>('loading');
const item = ref<MediaItem | null>();

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

const status = computed((): 'loading' | 'missing' | 'error' | 'loaded' | 'uploading' | 'available' => {
    if (item.value == null) {
        return loadStatus.value;
    } else {
        return item.value.status;
    }
});

const backgroundImage = computed((): string | null => {
    if (item.value == null) {
        return null;
    } else if (isMediaItemResizable(item.value)) {
        return item.value.src_icon;
    } else if (item.value.extension == 'svg' && item.value.src != null) {
        return item.value.src
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

const cssClasses = computed(() => {
    return {
        'has-thumb': (backgroundImage.value != null),
    };
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
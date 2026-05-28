<template>
  <div class="vfm-media-preview-wrapper">
    <div class="vfm-media-preview" :class="{'vfm-has-thumb': backgroundImage != null }" :data-vfm-media-status="status" :style="style" @click="select">
      <div class="vfm-media-preview-overlay" v-if="showOverlay">
        <Icon v-if="iconName" class="vfm-media-preview-icon" :icon="iconName" />
        <div v-if="status != 'available'" class="vfm-media-preview-status">{{ status }}</div>
      </div>
      <button v-if="inspectable" type="button" class="vfm-media-preview-inspect btn btn-sm btn-secondary" @click.stop="emit('inspect')"><Icon icon="search" /></button>
      <button v-if="removable" type="button" class="vfm-media-preview-remove btn btn-sm btn-danger" @click.stop="emit('remove')"><Icon icon="x" /></button>
    </div>
    <div v-if="item" class="vfm-media-preview-filename mt-1" :title="displayFilename">{{ displayFilename }}</div>
  </div>
</template>

<script setup lang="ts">
import type { MediaItem, IconName } from "../../types";
import { computed, toRef } from "vue";
import { hasThumbnail, getMediaItemIcon } from "../../lib/media";
import Icon from "../Icon.vue";

const props = defineProps<{
  item?: MediaItem | undefined | null | false;
  inspectable?: boolean;
  removable?: boolean;
}>();

const item = toRef(props, "item");

const emit = defineEmits<{
  (e: "inspect"): void;
  (e: "remove"): void;
  (e: "select"): void;
}>();

const status = computed((): "none" | "loading" | "missing" | "error" | "loaded" | "uploading" | "available" => {
  if (item.value === false) {
    return "none";
  }
  if (item.value == null) {
    return "loading";
  }
  return item.value.status;
});

const backgroundImage = computed((): string | null => {
  if (item.value == null || item.value === false) {
    return null;
  } else if (hasThumbnail(item.value)) {
    return item.value.src_thumb;
  } else if (item.value.extension == "svg" && item.value.src != null) {
    return item.value.src;
  } else {
    return null;
  }
});

const style = computed(() => {
  const style: { [key: string]: string } = {};
  if (backgroundImage.value != null) {
    style.backgroundImage = "url(" + backgroundImage.value + ")";
  }
  return style;
});

const iconName = computed((): IconName | null => {
  if (item.value === false) {
    return null;
  }
  if (item.value == null) {
    if (status.value == "loading") {
      return "loaderCircle";
    } else {
      return "triangleAlert";
    }
  }
  return getMediaItemIcon(item.value);
});

const showOverlay = computed((): boolean => {
  return iconName.value != null || status.value != "available";
});

const displayFilename = computed((): string => {
  if (item.value == null || item.value === false) {
    return "";
  }
  return item.value.extension ? `${item.value.title}.${item.value.extension}` : item.value.title;
});

const select = () => {
  emit("select");
};
</script>

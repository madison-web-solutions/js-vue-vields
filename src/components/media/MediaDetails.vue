<template>
  <div class="vfm-media-details">
    <div class="row g-2">
      <div class="col-12" data-name="back">
        <a href="#" @click.prevent="emit('close')"><Icon icon="moveLeft" /> Back</a>
      </div>
      <div ref="previewContainer" class="vfm-media-details-preview col-8">
        <img v-if="imageSrc" ref="previewImage" :src="imageSrc" @click="maybeSetCropCenter" />
        <div v-if="iconName" class="vfm-media-details-overlay">
          <Icon :icon="iconName"></Icon>
        </div>
        <Icon v-if="supportCropCenter && isImage" class="vfm-media-details-crop-center-left-pointer" :style="cropCenterMarkerStyle.left" icon="chevronDown" />
        <Icon v-if="supportCropCenter && isImage" class="vfm-media-details-crop-center-top-pointer" :style="cropCenterMarkerStyle.top" icon="chevronRight" />
      </div>
      <div class="col-4" data-name="details">
        <div class="mb-2">
          <p class="mb-0"><strong>Status:</strong> {{ status }}</p>
          <p class="mb-0" v-if="imgWidth && imgHeight"><strong>Dimensions:</strong> {{ imgWidth }}px x {{ imgHeight }}px</p>
        </div>
        <FieldGroup v-model="vals" v-model:errors="errors">
          <TextField label="Title" name="title" :disabled="!editable" class="mb-2" />
          <TextField label="Alt" name="alt" :disabled="!editable" class="mb-2" />
          <CompoundField v-if="supportCropCenter && isImage" label="Crop Center" name="cropCenter" :disabled="!editable" class="mb-2" help="Hold down alt or option key and click on image to set crop center">
            <div class="row g-2">
              <NumberField name="top" :min="0" :max="100" unit="% top" :disabled="!editable" class="col-lg" />
              <NumberField name="left" :min="0" :max="100" unit="% left" :disabled="!editable" class="col-lg" />
            </div>
          </CompoundField>
        </FieldGroup>
        <div class="mb-2">
          <button v-if="deletable" type="button" class="btn btn-link text-danger" @click.stop="emit('delete')">Delete</button>
        </div>
        <div class="mb-2">
          <button v-if="editable && isDirty" type="button" @click.stop="saveUpdates" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
      <div class="col-12" data-name="url">
        URL: <a v-if="item && item.src" :href="item.src" target="_blank">{{item.src}}</a>
        <span v-if="item && !item.src" class="text-danger">Error - File not found</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MediaItem, LookupResult, UpdateResult } from "../../types";
import { computed, ref, inject, watchEffect, onMounted, provide } from "vue";
import { IconName } from "../../types";
import { getMediaItemIcon } from "../../lib/media";
import FieldGroup from "../FieldGroup.vue";
import TextField from "../TextField.vue";
import CompoundField from "../CompoundField.vue";
import NumberField from "../NumberField.vue";
import Icon from "../Icon.vue";
import { getConfigRef } from "../../lib/config";
import injectionSymbols from "../../lib/injection-symbols";

const props = defineProps<{
  itemId: number | string;
  editable: boolean;
  deletable: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "delete"): void;
  (e: "updated", item: MediaItem): void;
}>();

type MediaVals = {
  title: string;
  alt: string;
  cropCenter?: { top: number; left: number };
};

// @todo This is a bit of a hack.
// If we have a MediaField in a FieldGroup, the FieldGroup will provide a valueLens and errorsLens
// This will then prevent the FieldGroup above from being able to access vals
// Really what I need to do is make it so that when a FieldGroup is given vals via v-model, the values always come from that instead of a valueLens which happened to be provided by some ancestor component
// But I haven't been able to come up with a way to do this yet
// For now, clearing the valueLens and errorsLens here enables the FieldGroup above to access vals
provide(injectionSymbols.valueLens, undefined);
provide(injectionSymbols.errorsLens, undefined);

const vals = ref<MediaVals>({ title: "", alt: "" });
const errors = ref({});
const imgWidth = ref<number | undefined>(undefined);
const imgHeight = ref<number | undefined>(undefined);

const provider = inject(injectionSymbols.mediaProvider);
const supportCropCenter = getConfigRef("media.supportCropCenter");

const loadStatus = ref<"loading" | "missing" | "error" | "loaded">("loading");
const item = ref<MediaItem | null>();

watchEffect(() => {
  item.value = null;
  loadStatus.value = "loading";
  if (provider != null) {
    provider
      .lookup(props.itemId)
      .then((result: LookupResult<MediaItem>) => {
        if (result.status == "found") {
          item.value = result.resource;
          loadStatus.value = "loaded";
          reset();
        } else {
          loadStatus.value = "missing";
        }
      });
  }
});

const status = computed((): "loading" | "missing" | "error" | "loaded" | "uploading" | "available" => {
    if (item.value == null) {
      return loadStatus.value;
    } else {
      return item.value.status;
    }
  },
);

const defaultCropCenter = () => {
  return supportCropCenter.value && isImage.value
    ? { left: 50, top: 50 }
    : undefined;
};

const sourceVals = computed((): MediaVals => {
  return {
    title: item.value?.title ?? "",
    alt: item.value?.alt ?? "",
    ...(supportCropCenter.value ? { cropCenter: item.value?.cropCenter ?? defaultCropCenter() } : {}),
  };
});

const isDirty = computed((): boolean => {
  return (
    vals.value.title != sourceVals.value.title ||
    vals.value.alt != sourceVals.value.alt ||
    JSON.stringify(vals.value.cropCenter) !=
      JSON.stringify(sourceVals.value.cropCenter)
  );
});

const reset = () => {
  vals.value = {
    title: sourceVals.value.title,
    alt: sourceVals.value.alt,
  };
  if (supportCropCenter.value) {
    vals.value.cropCenter = sourceVals.value.cropCenter;
  }
};

const isImage = computed((): boolean => {
  switch (item.value?.extension || "none") {
    case "jpg":
    case "jpeg":
    case "png":
    case "tif":
    case "tiff":
    case "gif":
    case "webp":
    case "svg":
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

const iconName = computed((): IconName | null => {
  if (item.value == null) {
    if (status.value == "loading") {
      return "loaderCircle";
    } else {
      return "triangleAlert";
    }
  } else {
    return getMediaItemIcon(item.value);
  }
});

const imageWithDimensionsUrl = computed((): string | undefined => {
  return imageSrc.value && item.value?.extension != "svg"
    ? imageSrc.value
    : undefined;
});

// Utility function to get the position and size of just the content part of an element (excluding margin, padding and borders)
const getContentBoundingRect = (ele: Element) => {
  const st = window.getComputedStyle(ele);
  const b = ele.getBoundingClientRect();
  return {
    left: b.left + parseFloat(st.borderLeftWidth) + parseFloat(st.paddingLeft),
    top: b.top + parseFloat(st.borderTopWidth) + parseFloat(st.paddingTop),
    width:
      b.width -
      parseFloat(st.borderLeftWidth) -
      parseFloat(st.paddingLeft) -
      parseFloat(st.borderRightWidth) -
      parseFloat(st.paddingRight),
    height:
      b.height -
      parseFloat(st.borderTopWidth) -
      parseFloat(st.paddingTop) -
      parseFloat(st.borderBottomWidth) -
      parseFloat(st.paddingBottom),
  };
};

// Code to position the cropCenter markers
const previewContainer = ref<HTMLElement | null>();
const previewImage = ref<HTMLImageElement | null>();
const resizeCount = ref(0);

// This function recalculates the styles for the crop center markers (especially their left/top positions) according to the left/top percentages in vals, and the current size / position of the image
const cropCenterMarkerStyle = computed(() => {
  resizeCount.value; // Accessing resizeCount here means we will re-run this function when resizeCount is increased
  if (
    supportCropCenter.value &&
    previewImage.value instanceof HTMLImageElement &&
    previewContainer.value instanceof HTMLElement &&
    vals.value.cropCenter?.left != null &&
    vals.value.cropCenter?.top != null
  ) {
    const cRect = previewContainer.value.getBoundingClientRect();
    const iRect = getContentBoundingRect(previewImage.value);

    const leftBase = iRect.left - cRect.left;
    const topBase = iRect.top - cRect.top;
    const cropCenterLeft = leftBase + (iRect.width * vals.value.cropCenter.left) / 100;
    const cropCenterTop = topBase + (iRect.height * vals.value.cropCenter.top) / 100;

    return {
      left: {
        top: topBase + "px",
        left: cropCenterLeft + "px",
      },
      top: {
        top: cropCenterTop + "px",
        left: leftBase + "px",
      },
    };
  } else {
    return {
      left: {
        display: "none",
      },
      top: {
        display: "none",
      },
    };
  }
});

onMounted(() => {
  // We can use a ResizeObsever to catch changes in size/position of the image or the container, and use that to trigger repositionCropCenterMarkers()
  let resizeObverver = new ResizeObserver(() => {
    // We can 'trick' cropCenterMarkerStyle to be recomputed by increasing this dummy value that is referenced in the computed function
    resizeCount.value++;
  });

  // Attach the image and container elements to the observer
  if (supportCropCenter.value && previewImage.value instanceof HTMLImageElement && previewContainer.value instanceof HTMLElement) {
    resizeObverver.observe(previewImage.value);
    resizeObverver.observe(previewContainer.value);
  } else {
    resizeObverver.disconnect();
  }
});

// Function to set the crop center of an image when a user alt-clicks on it
const maybeSetCropCenter = (e: MouseEvent) => {
  const img = e.target;
  if (
    supportCropCenter.value &&
    e.altKey &&
    isImage.value &&
    img instanceof HTMLImageElement
  ) {
    // Position of the click, in screen px, relative to the left/top edges of the image
    const r = getContentBoundingRect(img);
    const leftPos = e.clientX - r.left;
    const topPos = e.clientY - r.top;

    vals.value.cropCenter = {
      left: Math.max(0, Math.min(100, Math.round((100 * leftPos) / r.width))),
      top: Math.max(0, Math.min(100, Math.round((100 * topPos) / r.height))),
    };
  }
};

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
    provider
      .update(props.itemId, vals.value)
      .then((result: UpdateResult<MediaItem>) => {
        if (result.status == "ok") {
          item.value = result.resource;
          reset();
          emit("updated", result.resource);
        } else {
          errors.value = result.errors;
        }
      });
  }
};
</script>

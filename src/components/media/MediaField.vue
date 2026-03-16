<template>
  <FieldWrapper :field="field">
    <template #input>
      <div v-if="!inspecting && !choosing" class="vfm-media-preview-list">
        <MediaPreview
          v-if="modelValue != null"
          :item="currentItem"
          :removable="true"
          :inspectable="true"
          @remove="remove"
          @select="choosing = true"
          @inspect="inspecting = true"
        />
        <button v-if="modelValue == null" type="button" class="vfm-media-add-button" @click="choosing = true"><Icon icon="plus" /></button>
      </div>
      <Modal v-if="choosing" title="Media Library" size="xl" @close="choosing = false">
        <MediaLibrary
          :standalone="false"
          :extraParams="extraParams"
          @select="updateValue"
          @close="choosing = false"
        />
      </Modal>
      <Modal v-if="currentItem && inspecting" title="Inspect File" size="xl" @close="inspecting = false">
        <MediaDetails
          :itemId="currentItem.id"
          :editable="true"
          :deletable="false"
          @close="inspecting = false"
          @updated="onUpdated"
        />
      </Modal>
    </template>
    <template #viewMode>
      <div class="vfm-attachment-list">
        <MediaPreview
          :item="currentItem"
          :removable="false"
          :inspectable="false"
        />
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldProps, MediaItem, MessageBag } from "../../types";
import { ref, toRefs, watchEffect, inject } from "vue";
import FieldWrapper from "../FieldWrapper.vue";
import MediaPreview from "./MediaPreview.vue";
import MediaLibrary from "./MediaLibrary.vue";
import MediaDetails from "./MediaDetails.vue";
import Modal from "../Modal.vue";
import useFormField from "../../lib/useFormField";
import injectionSymbols from "../../lib/injection-symbols";
import Icon from "../Icon.vue";

type IdType = string | number | null;

const props = defineProps<FieldProps & {
  extraParams?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: IdType): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): IdType => {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
      return value;
  }
  return null;
};

const { modelValue, field } = useFormField<IdType>(coerceFn, emit, propRefs);

const provider = inject(injectionSymbols.mediaProvider);

// False means there is no item selected (the modelValue is null)
// Undefined means there is an item (modelValue is not null) but it is not yet loaded
const currentItem = ref<MediaItem | undefined | false>(modelValue.value == null ? false : undefined);

// Watch the modelValue and load up the correct MediaItem when it changes
watchEffect(() => {
  if (modelValue.value == null) {
    currentItem.value = false;
    return;
  }
  if (currentItem.value && currentItem.value.id === modelValue.value) {
    // We already have the correct item loaded
    return;
  }
  currentItem.value = undefined;
  if (provider != null && modelValue.value != null) {
    provider.lookup(modelValue.value).then((searchResult) => {
      if (searchResult.status == "found") {
        currentItem.value = searchResult.resource;
      }
    });
  }
});

const onUpdated = (item: MediaItem) => {
  currentItem.value = item;
};

const choosing = ref<boolean>(false);
const inspecting = ref<boolean>(false);

const remove = () => {
  modelValue.value = null;
};

const updateValue = (newId: IdType) => {
  modelValue.value = newId;
  choosing.value = false;
};
</script>

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

type IdType = string | number | undefined;

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
  return undefined;
};

const { modelValue, field } = useFormField<IdType>(coerceFn, emit, propRefs);

const provider = inject(injectionSymbols.mediaProvider);

const currentItem = ref<MediaItem | undefined>(undefined);

// Watch the modelValue and load up the correct MediaItem when it changes
watchEffect(() => {
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

const choosing = ref<boolean>(false);
const inspecting = ref<boolean>(false);

const remove = () => {
  modelValue.value = undefined;
};

const updateValue = (newId: IdType) => {
  modelValue.value = newId;
  choosing.value = false;
};
</script>

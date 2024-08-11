<template>
  <Teleport to="body">
    <div class="modal d-block" tabindex="-1">
      <div :class="dialogCssClasses">
        <div class="modal-content">
          <div v-if="hasHeader" class="modal-header">
            <slot name="header" :close="close">
              <h5 v-if="title" class="modal-title">{{ title }}</h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="close"
              ></button>
            </slot>
          </div>
          <div class="modal-body">
            <slot name="default"></slot>
          </div>
          <div v-if="hasFooter" class="modal-footer">
            <slot name="footer" :close="close"></slot>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </Teleport>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { computed } from "vue";

const props = defineProps({
  hasHeader: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
  },
  hasFooter: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<"sm" | "lg" | "xl">,
  },
});

const slots = defineSlots<{
  default: (props: {}) => any;
  header: (props: { close: () => void }) => any;
  footer: (props: { close: () => void }) => any;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const close = () => {
  emit("close");
};

const dialogCssClasses = computed(() => {
  const cssClasses = ["modal-dialog"];
  if (props.size) {
    cssClasses.push("modal-" + props.size);
  }
  return cssClasses;
});
</script>

<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import useExtendsPath from "../lib/useExtendsPath";
import { provideFormValuesAt } from "../lib/context";

const props = defineProps<{
  index: number;
}>();

const slots = defineSlots<{
  default: (props: {}) => any;
}>();

const index = toRef(props, "index");

// Scope the surrounding form values to this row by its index, so the row's contents bind into
// it. Replaces the per-row fixed lenses that used to bridge the parent indexed lens to one row.
useExtendsPath(index);
provideFormValuesAt(index);
</script>

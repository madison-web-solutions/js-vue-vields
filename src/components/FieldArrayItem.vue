<template>
  <slot></slot>
</template>

<script setup lang="ts">
import type { MessageBag, FormValue, FixedLens } from "../types";
import { toRef, provide, inject } from "vue";
import useExtendsPath from "../lib/useExtendsPath";
import { injectionSymbols } from "..";

const props = defineProps<{
  index: number;
}>();

const slots = defineSlots<{
  default: (props: {}) => any;
}>();

const index = toRef(props, "index");

useExtendsPath(index);

const parentValueLens = inject(injectionSymbols.valueLens, undefined);

const valueLens: FixedLens<FormValue> = {
  lensType: "fixed",
  get: (): FormValue => {
    if (parentValueLens && parentValueLens.lensType == "indexed") {
      return parentValueLens.get(index.value);
    } else {
      return undefined;
    }
  },
  set: (newVal: FormValue) => {
    if (parentValueLens && parentValueLens.lensType == "indexed") {
      parentValueLens.set(index.value, newVal);
    }
  },
};

provide(injectionSymbols.valueLens, valueLens);

const parentErrorsLens = inject(injectionSymbols.errorsLens, undefined);

const errorsLens: FixedLens<MessageBag> = {
  lensType: "fixed",
  get: (): MessageBag => {
    if (parentErrorsLens && parentErrorsLens.lensType == "indexed") {
      return parentErrorsLens.get(index.value);
    } else {
      return {};
    }
  },
  set: (newErrors: MessageBag) => {
    if (parentErrorsLens && parentErrorsLens.lensType == "indexed") {
      parentErrorsLens.set(index.value, newErrors);
    }
  },
};

provide(injectionSymbols.errorsLens, errorsLens);
</script>

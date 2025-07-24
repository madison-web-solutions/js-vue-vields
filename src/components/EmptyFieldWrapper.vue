<template>
  <slot name="input"></slot>
</template>

<script setup lang="ts" generic="ValueType extends FormValue">
import type { FieldState, FormValue } from "../types";

const props = defineProps<{
  field: FieldState<ValueType>,
  inputWrapperCssClass?: string | string[] | object,
}>();

</script>

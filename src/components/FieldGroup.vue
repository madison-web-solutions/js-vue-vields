<template>
  <slot></slot>
</template>

<script setup lang="ts">
import type { MessageBag, EditMode, CompoundFormValue, Config, Loose } from "../types";
import { toRef } from "vue";
import useFormField from '../lib/useFormField';
import useHasCompoundValue from '../lib/useHasCompoundValue';
import { coerceToCompoundFormValue } from '../lib/type-utils';
import useExtendsConfig from "../lib/useExtendsConfig";
import useExtendsEditMode from "../lib/useExtendsEditMode";

const props = defineProps<{
  modelValue?: any;
  errors?: MessageBag;
  editMode?: EditMode;
  config?: Loose<Config>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: CompoundFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = {
  modelValue: toRef(props, 'modelValue'),
  errors: toRef(props, 'errors'),
  editMode: toRef(props, 'editMode'),
  config: toRef(props, 'config'),
  name: undefined,
};

useExtendsConfig(propRefs.config);
useExtendsEditMode(propRefs.editMode);

const { modelValue, errors } = useFormField<CompoundFormValue>(coerceToCompoundFormValue, emit, propRefs);
useHasCompoundValue(modelValue, errors);

</script>

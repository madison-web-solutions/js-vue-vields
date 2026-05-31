<template>
  <slot></slot>
</template>

<script setup lang="ts">
import type { FieldEmitType, MessageBag, EditMode, CompoundFormValue, Config, Loose } from "../types";
import { toRef } from "vue";
import useFormField from '../lib/useFormField';
import { provideFormValues } from '../lib/context';
import { coerceToCompoundFormValue } from '../lib/type-utils';
import useExtendsConfig from "../lib/useExtendsConfig";
import useExtendsEditMode from "../lib/useExtendsEditMode";

const props = defineProps<{
  modelValue?: any;
  errors?: MessageBag;
  editMode?: EditMode;
  config?: Loose<Config>;
}>();

const emit = defineEmits<FieldEmitType<CompoundFormValue>>();

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
provideFormValues(modelValue, errors);

</script>

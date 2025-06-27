<template>
  <div>
    <slot name="label">
      <label v-if="field.label" :for="field.inputEleId" class="form-label">
        {{ field.label }}<span v-if="field.required">*</span>
      </label>
    </slot>
    <slot name="preinput"></slot>
    <div v-if="field.editMode == 'edit'" :class="inputWrapperCssClass">
      <slot name="input"></slot>
    </div>
    <slot v-if="field.editMode == 'edit'" name="errors">
      <div v-if="field.hasError" class="invalid-feedback d-block" data-testid="field-error-messages">
        <div class="error" v-for="msg in field.myErrors">{{ msg }}</div>
      </div>
    </slot>
    <div v-if="field.editMode == 'view'">
      <slot name="viewMode">
        <slot name="input"></slot>
      </slot>
    </div>
    <small v-if="field.help" class="form-text text-muted">{{ field.help }}</small>
  </div>
</template>

<script setup lang="ts" generic="ValueType extends FormValue">
import { FieldState, FormValue } from "../types";

const props = defineProps<{
  field: FieldState<ValueType>,
  inputWrapperCssClass?: string | string[] | object,
}>();

</script>

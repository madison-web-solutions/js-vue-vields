<template>
  <FieldWrapper :field="field" :inputWrapperCssClass="{ 'vfm-checkboxes-group': true, 'is-invalid': field.hasError }">
    <template #input>
      <div :class="listCssClass" :style="listStyle">
        <div v-for="choice in choicesNormalized" :key="choice.key" class="vfm-checkboxes-item" :class="isInline ? 'me-3' : ''">
          <div :class="{'form-check': true, 'vfm-checked': isOn(choice.key)}">
            <input
              class="form-check-input"
              type="checkbox"
              :id="field.inputEleId + choice.key"
              :name="field.pathString + '.' + choice.key"
              :checked="isOn(choice.key)"
              @change="toggle(choice.key)"
              :class="{ 'is-invalid': hasSubErrors(choice.key) }"
              :disabled="field.disabled"
            />
            <label class="form-check-label" :for="field.inputEleId + choice.key">
              <slot name="label" :choice="choice" :checked="isOn(choice.key)">{{ choice.label }}</slot>
            </label>
          </div>
          <div v-if="hasSubErrors(choice.key)" class="invalid-feedback d-block">
            <div class="error" v-for="msg in subErrors[choice.key]">{{ msg }}</div>
          </div>
        </div>
      </div>
    </template>
    <template #viewMode>
      <div v-if="viewModeDisplay == 'selected'" class="vfm-tokens-list">
        <div v-for="choice in selectedChoices" :key="choice.key" class="vfm-token-wrapper">
          <div class="vfm-token">
            <div class="vfm-token-content">
              <slot name="label" :choice="choice" :checked="true">{{ choice.label }}</slot>
            </div>
          </div>
        </div>
      </div>
      <div v-else :class="listCssClass" :style="listStyle">
        <div v-for="choice in choicesNormalized" :key="choice.key" class="vfm-checkboxes-item">
          <div class="d-inline-block">
              <slot name="label" :choice="choice" :checked="isOn(choice.key)">{{ choice.label }}</slot>
          </div>
          : {{ isOn(choice.key) ? trueLabel : falseLabel }}
        </div>
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps, HasChoicesMultipleFieldProps, KeyListFormValue, BooleansMapFormValue, Choosable } from "../types";
import { computed, toRefs } from "vue";
import useFormFieldWithChoicesMultiple from "../lib/useFormFieldWithChoicesMultiple";

const props = defineProps<FieldProps & HasChoicesMultipleFieldProps & {
  // Lay the choices out as a row that wraps, rather than one per line
  inline?: boolean | undefined,
  // Lay the choices out in (up to) this many vertical columns, filled top-to-bottom. Columns
  // collapse on narrow screens so the number is a maximum. Takes precedence over `inline`.
  // Intended for long lists of choices.
  columns?: number | undefined,
  // What view mode shows:
  //   'all'      - every choice, each followed by the trueLabel or falseLabel (default)
  //   'selected' - just the selected choices, as tokens. Intended for long lists of choices.
  viewModeDisplay?: 'all' | 'selected' | undefined,
  trueLabel?: string | undefined,
  falseLabel?: string | undefined,
}>();

const trueLabel = computed(() => props.trueLabel ?? 'Yes');
const falseLabel = computed(() => props.falseLabel ?? 'No');

const emit = defineEmits<FieldEmitType<KeyListFormValue | BooleansMapFormValue>>();

const propRefs = toRefs(props);

const {
  field,
  FieldWrapper,
  choicesNormalized,
  toggle,
  isOn,
  subErrors,
  hasSubErrors,
} = useFormFieldWithChoicesMultiple(emit, propRefs);

const hasColumns = computed((): boolean => {
  return props.columns != null && props.columns > 1;
});

// `columns` takes precedence over `inline`
const isInline = computed((): boolean => {
  return !!props.inline && !hasColumns.value;
});

const listCssClass = computed((): string => {
  if (hasColumns.value) {
    return "vfm-checkboxes-columns";
  } else if (isInline.value) {
    return "d-flex flex-wrap";
  } else {
    return "";
  }
});

const listStyle = computed((): Record<string, string> => {
  if (hasColumns.value) {
    return { columnCount: String(props.columns) };
  } else {
    return {};
  }
});

// Selected choices in the order they appear in the choices list (not the order they were checked)
const selectedChoices = computed((): Choosable[] => {
  return choicesNormalized.value.filter((choice) => isOn(choice.key));
});
</script>

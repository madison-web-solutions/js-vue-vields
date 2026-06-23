<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="vfm-tokens-input" :class="{ 'is-invalid': field.hasError }">
        <SearchField
          v-if="editable && searchable && directory"
          v-model="temp"
          placeholder="Search"
          :disabled="field.disabled"
          :directory="directory"
          :extraParams="extraParams"
        />
        <SelectField
          v-if="editable && !searchable"
          v-model="temp"
          placeholder="Select"
          :disabled="field.disabled"
          :choices="choices"
          :directory="directory"
          :extraParams="extraParams"
        />
      </div>
      <div class="vfm-tokens-list">
        <div v-for="(token, index) in tokens" class="vfm-token-wrapper">
          <div class="vfm-token" :class="{ 'is-invalid': tokenHasError(index) }">
            <div class="vfm-token-content">
              <slot name="tokenContent" v-if="!isPending(token)" :token="token">{{
                token.label || token.key
              }}</slot>
              <slot name="pendingTokenContent" v-if="isPending(token)" :token="token">{{ token.key }}</slot>
            </div>
            <div v-if="editable" class="vfm-token-delete" @click="removeToken(token.key)">
              <button class="btn btn-sm btn-outline-danger">
                <Icon icon="x" />
              </button>
            </div>
          </div>
          <div v-if="tokenHasError(index)" class="invalid-feedback d-block">
            <div class="error" v-for="msg in tokenErrors(index)">{{ msg }}</div>
          </div>
        </div>
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, FieldProps, HasChoicesFieldProps, KeyListFormValue, Choosable, PendingChoosable } from "../types";
import { computed, ref, toRefs, watch, watchEffect, inject } from "vue";
import { coerceToKeyListFormValue } from "../lib/type-utils";
import SearchField from "./SearchField.vue";
import SelectField from "./SelectField.vue";
import useFormField from "../lib/useFormField";
import useHasChoices from "../lib/useHasChoices";
import injectionSymbols from "../lib/injection-symbols";
import { reindexErrors } from "../lib/message-bag";
import Icon from "./Icon.vue";

const props = defineProps<FieldProps & HasChoicesFieldProps & {
  searchable: boolean,
}>();

const slots = defineSlots<{
  tokenContent: (props: { token: Choosable }) => any;
  pendingTokenContent: (props: { token: PendingChoosable }) => any;
}>();

const emit = defineEmits<FieldEmitType<KeyListFormValue>>();

const propRefs = toRefs(props);

const { modelValue, errors, field, FieldWrapper } = useFormField<KeyListFormValue>(coerceToKeyListFormValue, emit, propRefs);

// Per-token (item-level) errors. Each token's position in the value array is its error key,
// e.g. errors at "0" belong to the first token. The whole-field errors (the "" key) are
// rendered separately by the FieldWrapper.
const tokenErrors = (index: number): string[] => {
  return errors.value[index] || [];
};

const tokenHasError = (index: number): boolean => {
  return tokenErrors(index).length > 0;
};

const editable = computed((): boolean => {
  return field.value.editMode == "edit" && !props.disabled;
});

const provider = inject(injectionSymbols.choicesProvider, undefined);

const searchCache = ref<Record<string, Choosable>>({});

watchEffect(() => {
  if (props.searchable && props.choices == null) {
    modelValue.value.forEach((key) => {
      if (props.directory != null && provider != null) {
        const cacheKey = props.directory + "." + String(key);
        if (searchCache.value[cacheKey] == null) {
          provider.lookup(props.directory, key).then((searchResult) => {
            if (searchResult.status == "found") {
              searchCache.value[cacheKey] = searchResult.resource;
            }
          });
        }
      }
    });
  }
});

// We only want the full list of possible choices when using the SelectField version
const { choicesNormalized } = useHasChoices({
  directory: computed(() => (props.searchable ? undefined : propRefs.directory.value)),
  choices: computed(() => (props.searchable ? undefined : propRefs.choices.value)),
  extraParams: propRefs.extraParams,
});

const isPending = (
  choice: PendingChoosable | Choosable,
): choice is PendingChoosable => {
  return "pending" in choice;
};

const tokens = computed((): (PendingChoosable | Choosable)[] => {
  return modelValue.value.map((key) => {
    const fallback: PendingChoosable = { pending: true, key: key };
    if (props.searchable && props.choices == null) {
      const cacheKey = props.directory + "." + String(key);
      return searchCache.value[cacheKey] || fallback;
    } else {
      return (
        choicesNormalized.value.find((choice) => choice.key == key) || fallback
      );
    }
  });
});

// Temporary value used by the SearchField or SelectField.
// Must be initialised to null rather than undefined because undefined is interpreted as "no model binding"
const temp = ref<string | number | null>(null);

// When the temp value changes, add the new token to the list, then reset it
watch(temp, () => {
  if (temp.value != null) {
    addToken(temp.value);
  }
  window.setTimeout(() => {
    temp.value = null;
  }, 10);
});

const addToken = (key: string | number): void => {
  if (props.disabled || modelValue.value.includes(key)) {
    return;
  }
  const newValue = coerceToKeyListFormValue(modelValue.value); // creates a copy
  newValue.push(key);
  modelValue.value = newValue;
};

const removeToken = (key: string | number): void => {
  const index = modelValue.value.indexOf(key);
  if (props.disabled || index < 0) {
    return;
  }
  const newValue = coerceToKeyListFormValue(modelValue.value); // creates a copy
  newValue.splice(index, 1);
  modelValue.value = newValue;
  // Keep item-level error indexes aligned with the shortened value array.
  errors.value = reindexErrors(errors.value, (oldIndex) => {
    if (oldIndex === index) {
      return undefined;
    } else if (oldIndex > index) {
      return oldIndex - 1;
    } else {
      return oldIndex;
    }
  });
};
</script>

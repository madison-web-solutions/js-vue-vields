<template>
  <FieldWrapper :field="field">
    <template #input>
      <SearchField
        v-if="editable && searchable && directory"
        v-model="temp"
        placeholder="Search"
        :disabled="field.disabled"
        :directory="directory"
      />
      <SelectField
        v-if="editable && !searchable"
        v-model="temp"
        placeholder="Select"
        :disabled="field.disabled"
        :choices="choices"
        :directory="directory"
      />
      <div class="vfm-tokens-list">
        <div v-for="token in tokens" class="vfm-token">
          <div class="vfm-token-content">
            <slot name="tokenContent" v-if="!isPending(token)" :token="token">{{
              token.label || token.key
            }}</slot>
            <slot name="pendingTokenContent" v-if="isPending(token)" :token="token">{{ token.key }}</slot>
          </div>
          <div v-if="editable" class="token-delete" @click="removeToken(token.key)">
            <button class="btn btn-sm btn-outline-danger">
              <Icon icon="x" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldProps, HasChoicesFieldProps, MessageBag, KeyListFormValue, Choosable, PendingChoosable } from "../types";
import { computed, ref, toRefs, watch, watchEffect, inject } from "vue";
import { coerceToKeyListFormValue } from "../lib/type-utils";
import SearchField from "./SearchField.vue";
import SelectField from "./SelectField.vue";
import useFormField from "../lib/useFormField";
import useHasChoices from "../lib/useHasChoices";
import injectionSymbols from "../lib/injection-symbols";
import Icon from "./Icon.vue";

const props = defineProps<FieldProps & HasChoicesFieldProps & {
  searchable: boolean,
}>();

const slots = defineSlots<{
  tokenContent: (props: { token: Choosable }) => any;
  pendingTokenContent: (props: { token: PendingChoosable }) => any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: KeyListFormValue): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper } = useFormField<KeyListFormValue>(coerceToKeyListFormValue, emit, propRefs);

const editable = computed((): boolean => {
  return field.value.editMode == "edit" && !props.disabled;
});

const provider = inject(injectionSymbols.choicesProvider);

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

// Temporary value used by the SearchField or SelectField
const temp = ref<string | number | undefined>(undefined);

// When the temp value changes, add the new token to the list, then reset it
watch(temp, () => {
  if (temp.value != null) {
    addToken(temp.value);
  }
  window.setTimeout(() => {
    temp.value = undefined;
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
};
</script>

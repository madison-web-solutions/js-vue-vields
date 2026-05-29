<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="input-group">
        <div class="form-control" :class="{ 'is-invalid': field.hasError }" :disabled="field.disabled" @click="maybeToggleOpenSearch">
          <slot v-if="currentItem" name="suggestion" :suggestion="currentItem">{{ displayValue }}</slot>
          <span v-if="field.placeholder && !currentItem">{{ field.placeholder }}</span>
        </div>
        <button v-if="!disabled" class="btn btn-outline-primary" type="button" @click="toggleOpenSearch">
          <Icon icon="search" />
        </button>
        <button v-if="!disabled && modelValue" class="btn btn-outline-danger" type="button" @click="clearValue">
          <Icon icon="x" />
        </button>
      </div>
      <SearchInterface
        v-if="searchOpen"
        v-model="searchText"
        :suggestions="suggestions"
        :isSearching="isSearching"
        :noResults="noResults"
        :canFetchMore="canFetchMore"
        @enterPress="searchDebounced"
        @fetchNextPage="fetchNextPage"
        @close="closeSearch"
        @selected="chooseSuggestion"
      >
        <template #noResults>
          <slot name="noResults" :searchText="searchText">
            <div class="form-text text-warning">No results</div>
          </slot>
        </template>
        <template #suggestion="{ suggestion }">
          <slot name="suggestion" :suggestion="suggestion">{{ suggestion.label }}</slot>
        </template>
      </SearchInterface>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldEmitType, Choosable, SearchResultPage, FieldProps, UsesSearchesFieldProps } from "../types";
import { computed, ref, toRefs, watchEffect, inject } from "vue";
import useFormField from "../lib/useFormField";
import injectionSymbols from "../lib/injection-symbols";
import SearchInterface from "./SearchInterface.vue";
import useSearches from "../lib/useSearches";
import Icon from "./Icon.vue";

type IdType = string | number | null;

const props = defineProps<FieldProps & UsesSearchesFieldProps>();

const slots = defineSlots<{
  suggestion: (props: { suggestion: Choosable }) => any;
  noResults: (props: { searchText: string }) => any;
}>();

const emit = defineEmits<FieldEmitType<IdType>>();

const propRefs = toRefs(props);

const coerceFn = (value: any): IdType => {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
      return value;
  }
  return null;
};

const { modelValue, field, FieldWrapper } = useFormField<IdType>(coerceFn, emit, propRefs);

const provider = inject(injectionSymbols.choicesProvider, undefined);

const currentItem = ref<Choosable | null>(null);

watchEffect(async () => {
  currentItem.value = null;
  if (props.directory == null || provider == null || modelValue.value == null) {
    return;
  }
  const searchResult = await provider.lookup(props.directory, modelValue.value, props.extraParams);
  if (searchResult.status == "found") {
    currentItem.value = searchResult.resource;
  }
});

const searchFn = (page: number): Promise<SearchResultPage<Choosable>> | null => {
  if (props.directory == null || provider == null) {
    console.log("Cannot perform search - directory or provider are not set", props.directory, provider);
    return null;
  }
  if (searchText.value.length < 3) {
    return null;
  }
  return provider.search(props.directory, searchText.value, page, props.extraParams);
};

const {
  searchText,
  suggestions,
  noResults,
  canFetchMore,
  isSearching,
  fetchNextPage,
  searchDebounced,
  searchOpen,
  toggleOpenSearch,
  closeSearch,
} = useSearches<Choosable>(searchFn);

const maybeToggleOpenSearch = () => {
  if (!props.disabled) {
    toggleOpenSearch();
  }
};

const chooseSuggestion = (index: number) => {
  const suggestion = suggestions.value[index];
  if (props.disabled || suggestion == null) {
    return;
  }
  closeSearch();
  modelValue.value = suggestion.key;
};

const clearValue = () => {
  if (props.disabled) {
    return;
  }
  closeSearch();
  modelValue.value = null;
};

const displayValue = computed((): string => {
  if (currentItem.value) {
    return currentItem.value.label;
  } else if (modelValue.value) {
    return String(modelValue.value);
  } else {
    return "";
  }
});
</script>

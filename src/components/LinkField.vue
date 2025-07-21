<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="input-group">
        <select v-if="availableSchemes.length > 0" class="vfm-link-field-scheme-select form-select" v-model="schemeKey">
          <option v-for="scheme in availableSchemes" :value="scheme.key">
            {{ scheme.label }}
          </option>
        </select>
        <div v-if="schemeKey != 'url'" class="form-control" :class="{ 'is-invalid': field.hasError }" :disabled="disabled" @click="toggleOpenSearch">
          {{ displayValue }}
        </div>
        <input v-if="schemeKey == 'url'" type="text" class="form-control" :class="{ 'is-invalid': field.hasError }" :disabled="disabled" placeholder="https://" v-model="aliasKey" />
        <button v-if="schemeKey != 'url'" class="btn btn-outline-primary" type="button" @click="toggleOpenSearch">
          <i class="fas fa-search"></i>
        </button>
        <button v-if="aliasKey" class="btn btn-outline-danger" type="button" @click="clearValue">
          <i class="fas fa-times"></i>
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
        <template #suggestion="{ suggestion }">
          <slot name="suggestion" :suggestion="suggestion">{{ suggestion.label }}</slot>
        </template>
      </SearchInterface>
    </template>
    <template #viewMode>{{ displayValue }}</template>
  </FieldWrapper>
</template>

<script setup lang="ts">
import type { FieldProps, LinkAlias, MessageBag, LookupResult, SearchResultPage } from "../types";
import { computed, ref, inject, toRefs, watchEffect, watch } from "vue";
import SearchInterface from "./SearchInterface.vue";
import useFormField from "../lib/useFormField";
import FieldWrapper from "./FieldWrapper.vue";
import { coerceToString } from "../lib/type-utils";
import injectionSymbols from "../lib/injection-symbols";
import useSearches from "../lib/useSearches";

const props = defineProps<FieldProps & {
  extraParams?: Record<string, unknown>;
}>();

const slots = defineSlots<{
  suggestion: (props: { suggestion: LinkAlias }) => any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "update:errors", value: MessageBag): void;
}>();

const propRefs = toRefs(props);

const { modelValue, field } = useFormField<string|null>(coerceToString, emit, propRefs);

const provider = inject(injectionSymbols.linksProvider);

const urlScheme = { key: "url", label: "URL" };

const availableSchemes = computed((): { key: string; label: string }[] => {
  return provider?.schemes.concat(urlScheme) ?? [];
});

const schemeKey = ref<string>(urlScheme.key);
const aliasKey = ref<string | null>(null);

// Set scheme and aliasKey from the modelValue string (and update when modelValue changes)
const updateLocalVals = (newModelValue: string | null) => {
  if (newModelValue == null) {
    schemeKey.value = urlScheme.key;
    aliasKey.value = null;
  } else {
    const parts = newModelValue.split(":");
    if (parts.length > 1) {
      for (const scheme of availableSchemes.value) {
        if (scheme.key == parts[0]) {
          schemeKey.value = scheme.key;
          aliasKey.value = parts.slice(1).join(":");
        }
      }
    } else {
      schemeKey.value = urlScheme.key;
      aliasKey.value = newModelValue;
    }
  }
};
updateLocalVals(modelValue.value);
watch(modelValue, updateLocalVals);

// Set modelValue when schemeKey or aliasKey changes
watch([schemeKey, aliasKey], ([newSchemeKey, newAliasKey]) => {
  newSchemeKey = newSchemeKey || urlScheme.key;
  newAliasKey = newAliasKey || "";
  if (newSchemeKey == urlScheme.key && newAliasKey == "") {
    // If both are cleared, unset modelValue
    modelValue.value = null;
  } else {
    modelValue.value = newSchemeKey + ":" + newAliasKey;
  }
});

const currentLinkAlias = ref<LinkAlias | null>(null);

// Watch the modelValue and load up the correct LinkAlias when it changes
watchEffect(() => {
  if (
    currentLinkAlias.value &&
    currentLinkAlias.value.scheme == schemeKey.value &&
    currentLinkAlias.value.key == aliasKey.value
  ) {
    // We already have the correct item loaded
    return;
  }
  currentLinkAlias.value = null;
  if (
    provider != null &&
    schemeKey.value != "" &&
    schemeKey.value != urlScheme.key &&
    aliasKey.value != null &&
    aliasKey.value != ""
  ) {
    provider
      .lookup(schemeKey.value, aliasKey.value)
      .then((result: LookupResult<LinkAlias>) => {
        if (result.status == "found") {
          currentLinkAlias.value = result.resource;
        }
      });
  }
});

const searchFn = (
  page: number,
): Promise<SearchResultPage<LinkAlias>> | null => {
  if (
    schemeKey.value == "" ||
    schemeKey.value == urlScheme.key ||
    provider == null
  ) {
    return null;
  }
  if (searchText.value.length < 3) {
    return null;
  }
  return provider.search(
    schemeKey.value,
    searchText.value,
    page,
    props.extraParams,
  );
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
} = useSearches<LinkAlias>(searchFn);

const chooseSuggestion = (index: number) => {
  const suggestion = suggestions.value[index];
  if (props.disabled || suggestion == null) {
    return;
  }
  closeSearch();
  modelValue.value = suggestion.scheme + ":" + suggestion.key;
};

const clearValue = () => {
  aliasKey.value = null;
};

const displayValue = computed((): string => {
  if (schemeKey.value == urlScheme.key) {
    return modelValue.value || "";
  } else if (currentLinkAlias.value) {
    return currentLinkAlias.value.label;
  } else {
    return aliasKey.value || "";
  }
});
</script>

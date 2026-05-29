<template>
  <FieldWrapper :field="field">
    <template #input>
      <div class="input-group">
        <select v-if="availableSchemes.length > 0" class="vfm-link-field-scheme-select form-select" :value="schemeKey" @change="changeScheme(($event.target as HTMLSelectElement).value)">
          <option v-for="scheme in availableSchemes" :value="scheme.key">
            {{ scheme.label }}
          </option>
        </select>
        <div v-if="schemeKey != 'url'" class="form-control" :class="{ 'is-invalid': field.hasError }" :disabled="disabled" @click="toggleOpenSearch">
          {{ displayValue }}
        </div>
        <input v-if="schemeKey == 'url'" type="text" class="form-control" :class="{ 'is-invalid': field.hasError }" :disabled="disabled" placeholder="https://" v-model="aliasKey" />
        <button v-if="schemeKey != 'url'" class="btn btn-outline-primary" type="button" :disabled="field.disabled" @click="toggleOpenSearch">
          <i class="fas fa-search"></i>
        </button>
        <button v-if="aliasKey" class="btn btn-outline-danger" type="button" :disabled="field.disabled" @click="clearValue">
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
import type { FieldEmitType, FieldProps, LinkAlias, LookupResult, SearchResultPage } from "../types";
import { computed, ref, inject, toRefs, watchEffect, watch } from "vue";
import SearchInterface from "./SearchInterface.vue";
import useFormField from "../lib/useFormField";
import { coerceToString } from "../lib/type-utils";
import injectionSymbols from "../lib/injection-symbols";
import useSearches from "../lib/useSearches";

const props = defineProps<FieldProps & {
  extraParams?: Record<string, unknown>;
}>();

const slots = defineSlots<{
  suggestion: (props: { suggestion: LinkAlias }) => any;
}>();

const emit = defineEmits<FieldEmitType<string | null>>();

const propRefs = toRefs(props);

const { modelValue, field, FieldWrapper } = useFormField<string|null>(coerceToString, emit, propRefs);

const provider = inject(injectionSymbols.linksProvider);

const urlScheme = { key: "url", label: "URL" };

const availableSchemes = computed((): { key: string; label: string }[] => {
  return provider?.schemes.concat(urlScheme) ?? [];
});

const schemeKey = ref<string>(urlScheme.key);
const aliasKey = ref<string | null>(null);

// Per-scheme saved alias keys, populated by changeScheme so that switching back to a
// previously-selected scheme restores the key the user had there.
const savedAliasKeys = ref<Record<string, string | null>>({});

// Set scheme and aliasKey from the modelValue string (and update when modelValue changes).
// A null value clears the key but keeps the current scheme — clearing should not reset the
// user's scheme choice. Otherwise, only reset savedAliasKeys when the scheme actually changes
// (round-trips from our own watch keep the same scheme, so they leave savedAliasKeys intact).
const updateLocalVals = (newModelValue: string | null) => {
  // null or empty (coerceToString maps null -> "") means no value — keep the current scheme
  if (newModelValue == null || newModelValue === "") {
    aliasKey.value = null;
    return;
  }

  let newScheme: string;
  let newAlias: string;

  const colonIndex = newModelValue.indexOf(':');
  if (colonIndex > 0) {
    const prefix = newModelValue.slice(0, colonIndex);
    const matchingScheme = availableSchemes.value.find(s => s.key === prefix);
    if (matchingScheme) {
      newScheme = matchingScheme.key;
      newAlias = newModelValue.slice(colonIndex + 1);
    } else {
      // Unrecognized prefix (e.g. legacy plain URL like https://...) — treat as raw URL
      newScheme = urlScheme.key;
      newAlias = newModelValue;
    }
  } else {
    // No colon — treat as raw URL
    newScheme = urlScheme.key;
    newAlias = newModelValue;
  }

  if (newScheme !== schemeKey.value) {
    // Genuine external scheme change — forget saved per-scheme keys
    savedAliasKeys.value = {};
  }
  schemeKey.value = newScheme;
  aliasKey.value = newAlias;
};
updateLocalVals(modelValue.value);
watch(modelValue, updateLocalVals);

// User-initiated scheme change via the dropdown.
// Saves the current aliasKey under the old scheme so switching back restores it.
const changeScheme = (newScheme: string) => {
  savedAliasKeys.value[schemeKey.value] = aliasKey.value;
  schemeKey.value = newScheme;
  aliasKey.value = savedAliasKeys.value[newScheme] ?? null;
};

// Set modelValue when schemeKey or aliasKey changes.
// When there is no key (or URL), the field has no value, so emit null regardless of the
// selected scheme — the scheme is retained as UI state but not persisted on its own.
watch([schemeKey, aliasKey], ([newSchemeKey, newAliasKey]) => {
  newSchemeKey = newSchemeKey || urlScheme.key;
  newAliasKey = newAliasKey || "";
  if (newAliasKey == "") {
    modelValue.value = null;
  } else {
    modelValue.value = newSchemeKey + ":" + newAliasKey;
  }
});

const currentLinkAlias = ref<LinkAlias | null>(null);

// Track in-flight lookup requests to discard stale responses
let lookupCount = 0;

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
    const lookupId = ++lookupCount;
    provider
      .lookup(schemeKey.value, aliasKey.value)
      .then((result: LookupResult<LinkAlias>) => {
        if (lookupId === lookupCount && result.status == "found") {
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
  if (field.value.disabled) {
    return;
  }
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

<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div class="input-group">
                <select v-if="availableSchemes.length > 0" v-pclass="'link-field-scheme-select'" class="form-select" v-model="schemeKey">
                    <option v-for="scheme in availableSchemes" :value="scheme.key">{{ scheme.label }}</option>
                </select>
                <div v-if="schemeKey != 'url'" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" @click="toggleOpenSearch">
                    {{ displayValue }}
                </div>
                <input v-if="schemeKey == 'url'" type="text" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" placeholder="https://" v-model="aliasKey" />
                <button v-if="schemeKey != 'url'" class="btn btn-outline-primary" type="button" @click="toggleOpenSearch"><i class="fas fa-search"></i></button>
                <button v-if="aliasKey" class="btn btn-outline-danger" type="button" @click="clearValue"><i class="fas fa-times"></i></button>
            </div>
            <SearchInterface v-if="searchOpen"
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
import type { LinkAlias, MessageBag, LookupResult, SearchResultPage } from '../main';
import { computed, ref, inject, toRefs, watchEffect, watch } from 'vue';
import { commonProps, useFormField, useSearches, symbols } from '../main';
import SearchInterface from './SearchInterface.vue';

const props = defineProps(Object.assign({}, commonProps, {
    extraParams: {
        type: Object,
    },
}));

const slots = defineSlots<{
    suggestion: (props: {suggestion: LinkAlias}) => any,
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): string => {
    return value ? String(value) : '';
};

const { modelValue, hasError, FieldWrapper, standardWrapperProps } = useFormField<string | undefined>(coerceFn, emit, propRefs, {
    fieldTypeSlug: 'link'
});

const provider = inject(symbols.linksProvider);

const urlScheme = {key: 'url', label: 'URL'};

const availableSchemes = computed((): {key: string, label: string}[] => {
    if (provider == null || provider.value == null) {
        return [];
    } else {
        return provider.value.schemes.concat(urlScheme);
    }
});

const schemeKey = ref<string>(urlScheme.key);
const aliasKey = ref<string | undefined>(undefined);

// Set scheme and aliasKey from the modelValue string (and update when modelValue changes)
const updateLocalVals = (newModelValue: string | undefined) => {
    if (newModelValue == null) {
        schemeKey.value = urlScheme.key;
        aliasKey.value = undefined;
    } else {
        const parts = newModelValue.split(':');
        if (parts.length > 1) {
            for (const scheme of availableSchemes.value) {
                if (scheme.key == parts[0]) {
                    schemeKey.value = scheme.key;
                    aliasKey.value = parts.slice(1).join(':');
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
    newSchemeKey = (newSchemeKey || urlScheme.key);
    newAliasKey = (newAliasKey || '');
    if (newSchemeKey == urlScheme.key && newAliasKey == '') {
        // If both are cleared, unset modelValue
        modelValue.value = undefined;
    } else {
        modelValue.value = newSchemeKey + ':' + newAliasKey;
    }
});

const currentLinkAlias = ref<LinkAlias | null>(null);

// Watch the modelValue and load up the correct LinkAlias when it changes
watchEffect(() => {
    if (currentLinkAlias.value && currentLinkAlias.value.scheme == schemeKey.value && currentLinkAlias.value.key == aliasKey.value) {
        // We already have the correct item loaded
        return;
    }
    currentLinkAlias.value = null;
    if (provider != null && schemeKey.value != '' && schemeKey.value != urlScheme.key && aliasKey.value != null && aliasKey.value != '') {
        provider.value.lookup(schemeKey.value, aliasKey.value).then((result: LookupResult<LinkAlias>) => {
            if (result.status == 'found') {
                currentLinkAlias.value = result.resource;
            }
        });
    }
});

const searchFn = (page: number): Promise<SearchResultPage<LinkAlias>> | null => {
    if (schemeKey.value == '' || schemeKey.value == urlScheme.key || provider == null) {
        return null;
    }
    if (searchText.value.length < 3) {
        return null;
    }
    return provider.value.search(schemeKey.value, searchText.value, page, props.extraParams);
};

const { searchText, suggestions, noResults, canFetchMore, isSearching, fetchNextPage, searchDebounced, searchOpen, toggleOpenSearch, closeSearch } = useSearches<LinkAlias>(searchFn);

const chooseSuggestion = (index: number) => {
    const suggestion = suggestions.value[index];
    if (props.disabled || suggestion == null) {
        return;
    }
    closeSearch();
    modelValue.value = suggestion.scheme + ':' + suggestion.key;
};

const clearValue = () => {
    aliasKey.value = undefined;
};

const displayValue = computed((): string => {
    if (schemeKey.value == urlScheme.key) {
        return modelValue.value || '';
    } else if (currentLinkAlias.value) {
        return currentLinkAlias.value.label;
    } else {
        return aliasKey.value || '';
    }
});

</script>

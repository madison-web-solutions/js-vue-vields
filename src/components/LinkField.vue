<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="input-group">
                <select v-if="availableSchemes.length > 0" class="form-control flex-grow-0 w-auto" v-model="schemeKey">
                    <option v-for="scheme in availableSchemes" :value="scheme.key">{{ scheme.label }}</option>
                </select>
                <div v-if="schemeKey != 'url'" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" @click="toggleOpenSearch">
                    {{ displayValue }}
                </div>
                <input v-if="schemeKey == 'url'" type="text" class="form-control" :class="{'is-invalid': hasError}" :disabled="disabled" placeholder="https://" v-model="aliasKey" />
                <button v-if="schemeKey != 'url'" class="btn btn-outline-primary" type="button" @click="toggleOpenSearch"><i class="fas fa-search"></i></button>
                <button v-if="aliasKey" class="btn btn-outline-danger" type="button" @click="clearValue"><i class="fas fa-times"></i></button>
            </div>
            <SearchInterface v-if="searchOpen" :searchFn="searchFn" @close="closeSearch" @selected="chooseSuggestion" />
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { LookupResult } from '@/main';
import { Choosable, LinkAlias, MessageBag, symbols } from '@/main';
import { computed, ref, inject, toRefs, watchEffect } from 'vue';
import { commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';
import SearchInterface from './SearchInterface.vue';

const props = defineProps(Object.assign({}, commonProps, {
    extraParams: {
        type: Object,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): string => {
    return value ? String(value) : '';
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<string | undefined>(coerceFn, emit, propRefs);

const provider = inject(symbols.linksProvider);

const urlScheme = {key: 'url', label: 'URL'};

const availableSchemes = computed((): Choosable[] => {
    if (provider == null || provider.value == null) {
        return [];
    } else {
        return provider.value.schemes.concat(urlScheme);
    }
});

const modelValueParts = computed(() => {
    if (provider == null || provider.value == null || modelValue.value == null) {
        return {
            scheme: urlScheme,
            key: '',
        };
    }
    const parts = modelValue.value.split(':', 2);
    if (parts.length == 2) {
        for (const scheme of availableSchemes.value) {
            if (scheme.key == parts[0]) {
                return {
                    scheme: scheme,
                    key: parts[1],
                };
            }
        }
    }
    return {
        scheme: urlScheme,
        key: modelValue.value,
    };
});

const schemeKey = computed({
    get: (): string => {
        return String(modelValueParts.value.scheme.key);
    },
    set: (newSchemeKey: string) => {
        modelValue.value = newSchemeKey + ':'; 
    }
});

const aliasKey = computed({
    get: (): string => {
        return modelValueParts.value.key;
    },
    set: (newAliasKey: string) => {
        modelValue.value = schemeKey.value + ':' + newAliasKey; 
    }
});

const clearValue = () => {
    if (modelValueParts.value.scheme == null) {
        modelValue.value = '';
    } else {
        modelValue.value = schemeKey.value + ':';
    }
};

const currentLinkAlias = ref<LinkAlias | null>(null);

watchEffect(() => {
    currentLinkAlias.value = null;
    if (provider != null && modelValueParts.value.scheme != null) {
        provider.value.lookup(schemeKey.value, modelValueParts.value.key).then((result: LookupResult<LinkAlias>) => {
            if (result.status == 'found') {
                currentLinkAlias.value = result.resource;
            }
        });
    }
});

const searchFn = (searchTextValue: string, page: number) => {
    if (modelValueParts.value.scheme == null || provider == null) {
        return null;
    }
    if (searchTextValue.length < 3) {
        return null;
    }
    return provider.value.search(schemeKey.value, searchTextValue, page, props.extraParams);
};

// Is the search interface open or not?
const searchOpen = ref(false);

const toggleOpenSearch = () => {
    if (searchOpen.value) {
        closeSearch();
    } else {
        openSearch();
    }
};

const closeSearch = () => {
    searchOpen.value = false;
};

const openSearch = () => {
    if (props.disabled) {
        return;
    }
    searchOpen.value = true;
};

const chooseSuggestion = (suggestion: Choosable | undefined) => {
    if (props.disabled) {
        return;
    }
    closeSearch();
    modelValue.value = (suggestion == null ? undefined : (suggestion as LinkAlias).scheme + ':' + suggestion.key);
};

const displayValue = computed((): string => {
    if (schemeKey.value == 'url') {
        return modelValue.value || '';
    } else if (currentLinkAlias.value) {
        return currentLinkAlias.value.label;
    } else {
        return modelValueParts.value.key || '';
    }
});

</script>

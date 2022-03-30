<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="input-group">
                <select v-if="availableSchemes.length > 0" class="form-control flex-grow-0 w-auto">
                    <option v-for="scheme in availableSchemes" :value="scheme.key">{{ scheme.label }}</option>
                </select>
                <input type="text" class="form-control" />
                <button v-if="modelValueParts.custom" class="btn btn-outline-primary" type="button"><i class="fas fa-search"></i></button>
                <button v-if="modelValue" class="btn btn-outline-danger" type="button"><i class="fas fa-times"></i></button>
            </div>
        </template>
        <template #viewMode>{{ displayValue }}</template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import { Choosable, LinkAlias, MessageBag, symbols } from '@/main';
import { computed, ref, inject, toRefs, watchEffect } from 'vue';
import { commonProps, useFormField } from '@/main';
import { FieldWrapper } from '@/main';
/*
Maybe there should be a provider saying what custom types of thing you can link to
eg product, page, category etc
In the database we can treat these things as custom url schemes, so we'll have things like
https://www.google.co.uk
product://234
category://spoons
If the URL scheme is one of the things the provider said we could link to, then we can look up
the actual URL of the item using the search provider perhaps
eg product://234 -> https://somesite.co.uk/p/a-nice-product
If the URL scheme is not in the list from the provider, then we just show the raw text in an input
We can have a dropdown with 'Product', 'Page', 'Category', 'URL'
When editing the value, if one of the linkable types is chosen, we can give them a search
interface, and search for things to link to..
what directory should we use? Always use 'link' perhaps, and supply the scheme as a parameter?
directory=link extraParams={scheme:product}
Or maybe we require a different provider for link searches? Seems a bit pointless though as the
methods are bound to be very similar...
although, when you're creating your provider implementation you can just use the same function for
both implementations.
*/


const props = defineProps(Object.assign({}, commonProps, {}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: unknown): string => {
    return value ? String(value) : '';
};

const { inputEleId, modelValue, myErrors, hasError } = useFormField<string>(coerceFn, emit, propRefs);

const provider = inject(symbols.linksProvider);

const availableSchemes = computed((): Choosable[] => {
    if (provider == null || provider.value == null) {
        return [];
    } else {
        return provider.value.schemes;
    }
});

const modelValueParts = computed(() => {
    if (provider == null || provider.value == null) {
        return {
            custom: true,
            url: modelValue.value,
        };
    }
    const parts = modelValue.value.split('://', 2);
    if (parts.length == 2) {
        for (const scheme of provider.value.schemes) {
            if (scheme.key == parts[0]) {
                return {
                    custom: false,
                    scheme: scheme,
                    key: parts[1],
                };
            }
        }
    }
    return {
        custom: true,
        url: modelValue.value,
    };
});

const currentLinkAlias = ref<LinkAlias | null>(null);

watchEffect(() => {
    currentLinkAlias.value = null;
    if (provider != null && modelValueParts.value.scheme != null) {
        provider.value.lookup(modelValueParts.value.scheme.key, modelValueParts.value.key).then((result) => {
            currentLinkAlias.value = result;
        });
    }
});

const displayValue = computed((): string => {
    if (currentLinkAlias.value) {
        return currentLinkAlias.value.label;
    } else {
        return modelValue.value;
    }
});

</script>

<template>
    <FieldWrapper v-bind="standardWrapperProps">
        <template #input>
            <div v-if="! inspecting && ! choosing" class="media-preview-list">
                <MediaPreview v-if="modelValue != null" :item="currentItem" :removable="true" :inspectable="true" @remove="remove" @select="choosing = true" @inspect="inspecting = true" />
                <button v-if="modelValue == null" type="button" class="media-add-button" @click="choosing = true"><i class="fas fa-plus"></i></button>
            </div>
            <div v-if="choosing" @close="choosing = false" title="Media Library">
                <MediaLibrary :standalone="false" :extraParams="extraParams" @select="updateValue" @close="choosing = false" />
            </div>
            <div v-if="currentItem && inspecting" @close="inspecting = false" title="Inspect File">
                <MediaDetails :itemId="currentItem.id" :editable="true" :deletable="false" @close="inspecting = false" />
            </div>
        </template>
        <template #viewMode>
            <div class="attachment-list">
                <MediaPreview :item="currentItem" :removable="false" :inspectable="false" />
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MediaItem, MessageBag, LookupResult } from '@/main';
import { computed, ref, toRefs, watchEffect, inject } from 'vue';
import { commonProps, useFormField, symbols } from '@/main';
import { FieldWrapper, MediaPreview, MediaLibrary, MediaDetails } from '@/main';

type IdType = string | number | undefined;

const props = defineProps(Object.assign({}, commonProps, {
    extraParams: {
        type: Object,
    },
}));

const emit = defineEmits<{
    (e: 'update:modelValue', value: IdType): void
    (e: 'update:errors', value: MessageBag): void
}>();

const propRefs = toRefs(props);

const coerceFn = (value: any): IdType => {
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
            return value;
    }
    return undefined;
};

const { modelValue, standardWrapperProps } = useFormField<IdType>(coerceFn, emit, propRefs);

const provider = inject(symbols.mediaProvider);

const currentItem = ref<MediaItem | undefined>(undefined);

// Watch the modelValue and load up the correct MediaItem when it changes
watchEffect(() => {
    if (currentItem.value && currentItem.value.id === modelValue.value) {
        // We already have the correct item loaded
        return;
    }
    currentItem.value = undefined;
    if (provider != null && modelValue.value != null) {
        provider.value.lookup(modelValue.value).then((searchResult) => {
            if (searchResult.status == 'found') {
                currentItem.value = searchResult.resource;
            }
        });
    }
});

const choosing = ref<boolean>(false);
const inspecting = ref<boolean>(false);

const remove = () => {
    modelValue.value = undefined;
};

const updateValue = (newId: IdType) => {
    modelValue.value = newId;
    choosing.value = false;
};

</script>
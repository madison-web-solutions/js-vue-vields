<template>
    <FieldWrapper :inputEleId="inputEleId" :label="label" :required="required" :help="help" :errors="myErrors">
        <template #input>
            <div class="attachment-list">
                <MediaPreview v-if="currentItem" :itemId="currentItem.id" :removable="true" :inspectable="true" @remove="remove" @select="choosing = true" @inspect="inspecting = true" />
                <span v-if="modelValue != null && currentItem == null">loading - TODO</span>
                <button v-if="modelValue == null" type="button" @click="choosing = true"><i class="fas fa-plus"></i></button>
            </div>
            <div v-if="choosing" @close="choosing = false" title="Media Library">
                <MediaLibrary :standalone="false" @select="updateValue" />
            </div>
            <div v-if="currentItem && inspecting" @close="inspecting = false" title="Inspect File">
                <MediaDetails :itemId="currentItem.id" :editable="true" :deletable="false" />
            </div>
        </template>
        <template #readonly>
            <div class="attachment-list">
                <MediaPreview v-if="currentItem" :itemId="currentItem.id" :removable="false" :inspectable="false" />
            </div>
        </template>
    </FieldWrapper>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import type { MediaItem, ResizableMediaItem } from '@/lib/media';
import { computed, ref, toRefs, watchEffect, inject, onBeforeUnmount } from 'vue';
import { commonProps, useFormField, symbols } from '@/main';
import { FieldWrapper, MediaPreview, MediaLibrary, MediaDetails } from '@/main';

type IdType = string | number | undefined;

const props = defineProps(Object.assign({}, commonProps, {}));

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

const { inputEleId, modelValue, myErrors, hasError } = useFormField<IdType>(coerceFn, emit, propRefs);

const provider = inject(symbols.mediaProvider);

const currentItem = ref<MediaItem | null>(null);

watchEffect(() => {
    currentItem.value = null;
    if (provider != null && modelValue.value != null) {
        provider.value.lookup(modelValue.value).then((searchResult) => {
            currentItem.value = searchResult;
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
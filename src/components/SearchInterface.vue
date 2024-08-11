<template>
    <div ref="container">
        <input class="form-control" ref="searchInput" type="text" placeholder="Search" v-model="searchText" @keydown.enter.prevent="emit('enterPress')" />
        <div v-pclass="'search-field-results'" @scroll="handleScroll">
            <slot v-if="noResults" name="noResults" :searchText="searchText">
                <div class="form-text text-warning">No results</div>
            </slot>
            <div v-if="suggestions.length > 0" class="list-group">
                <button v-for="suggestion, index in suggestions" class="list-group-item list-group-item-action" type="button" @click="emit('selected', index)">
                    <slot name="suggestion" :suggestion="suggestion"></slot>
                </button>
            </div>
            <div v-if="canFetchMore">
                <button class="btn btn-link" type="button" @click="emit('fetchNextPage')">more</button>
            </div>
            <div v-if="isSearching" class="form-text">Searching...</div>
        </div>
    </div>
</template>

<script setup lang="ts" generic="T extends Choosable">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import type { Choosable } from 'vue-fields-ms';
import type { PropType } from 'vue';

const props = defineProps({
    modelValue: {
        type: String,
        required: false,
    },
    suggestions: {
        type: Array as PropType<T[]>,
        required: true
    },
    isSearching: {
        type: Boolean,
        default: false,
    },
    noResults: {
        type: Boolean,
        default: false,
    },
    canFetchMore: {
        type: Boolean,
        default: false,
    }
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'close'): void,
    (e: 'selected', index: number): void,
    (e: 'enterPress'): void,
    (e: 'fetchNextPage'): void,
}>();

const slots = defineSlots<{
    suggestion: (props: {suggestion: T}) => any,
    noResults: (props: {searchText: string}) => any,
}>();

const container = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

const searchText = computed({
    get: (): string => {
        return props.modelValue || '';
    },
    set: (newVal: string) => {
        emit('update:modelValue', newVal);
    }
});

// Close the search interface if the user has clicked on the page outside of it
const maybeCloseSearch = (e: MouseEvent) => {
    const target = e.target as Element;
    if (document.body.contains(target) && container.value != null) {
        if (container.value === target || container.value.contains(target)) {
            // User clicked inside the search interface, so leave it open
        } else {
            // user clicked outside the search interface, so interpret this as trying to close the search
            emit('close');
        }
    }
};

onMounted(() => {
    searchInput.value && searchInput.value.focus();
    window.setTimeout(() => document.addEventListener('click', maybeCloseSearch), 10);
});

// Remove the maybeCloseSearch listener before unmounting
onBeforeUnmount(() => {
    document.removeEventListener('click', maybeCloseSearch);
});

// Fetch the next page of results when the user scrolls to the bottom of the search results
const handleScroll = (e: Event) => {
    if (props.canFetchMore) {
        const ele = e.target as HTMLElement;
        const scrollProportion = ((ele.scrollTop + ele.offsetHeight) / ele.scrollHeight);
        if (scrollProportion > 0.9) {
            emit('fetchNextPage');
        }
    }
};

</script>
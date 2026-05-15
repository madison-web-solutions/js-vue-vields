<template>
  <nav class="bg-dark px-3 py-1 d-flex align-items-center gap-1">
    <span class="text-secondary me-3 small fw-semibold">vue-fields-ms demo</span>
    <button
      type="button"
      class="nav-link px-3"
      :class="currentView === 'article' ? 'text-white' : 'text-white-50'"
      @click="currentView = 'article'"
    >
      Article Form
    </button>
    <button
      type="button"
      class="nav-link px-3"
      :class="currentView === 'fields' ? 'text-white' : 'text-white-50'"
      @click="currentView = 'fields'"
    >
      All Fields
    </button>
  </nav>

  <div class="container-fluid py-4">
    <ArticleView v-if="currentView === 'article'" />
    <AllFieldsView v-if="currentView === 'fields'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ArticleView from './views/ArticleView.vue'
import AllFieldsView from './views/AllFieldsView.vue'

const currentView = ref<'article' | 'fields'>('article')
</script>

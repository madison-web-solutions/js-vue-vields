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
    <button
      type="button"
      class="nav-link px-3"
      :class="currentView === 'login' ? 'text-white' : 'text-white-50'"
      @click="currentView = 'login'"
    >
      Login Form
    </button>
  </nav>

  <div class="container-fluid py-4">
    <ArticleView v-if="currentView === 'article'" />
    <AllFieldsView v-if="currentView === 'fields'" />
    <LoginView v-if="currentView === 'login'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ArticleView from './views/ArticleView.vue'
import AllFieldsView from './views/AllFieldsView.vue'
import LoginView from './views/LoginView.vue'

const currentView = ref<'article' | 'fields' | 'login'>('article')
</script>

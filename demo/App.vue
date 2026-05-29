<template>
  <nav class="bg-dark px-3 py-1 d-flex align-items-center gap-1">
    <span class="text-secondary me-3 small fw-semibold">vue-fields-ms demo</span>
    <RouterLink
      v-for="link in navLinks"
      :key="link.to"
      :to="link.to"
      class="nav-link px-3 text-white-50"
      active-class="text-white"
    >
      {{ link.label }}
    </RouterLink>
  </nav>

  <div class="container-fluid py-4">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { routes } from './router'

// Build the top nav from the routes that have a title, so adding a page is a one-line change
// in router.ts.
const navLinks = routes
  .filter(route => typeof route.path === 'string' && route.meta?.title)
  .map(route => ({ to: route.path as string, label: route.meta!.title as string }))
</script>

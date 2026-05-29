<template>
  <div class="d-flex align-items-center gap-3 p-2 border rounded bg-white">
    <div
      class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
      :class="hasIssues ? 'bg-danger' : 'bg-primary'"
      style="width: 2.5rem; height: 2.5rem"
    >{{ initials || '?' }}</div>

    <div class="flex-grow-1 min-w-0">
      <div class="fw-semibold text-truncate">{{ name || 'No name yet' }}</div>
      <div class="small text-muted text-truncate">{{ email || 'No email yet' }}</div>
    </div>

    <span v-if="hasIssues" class="badge bg-danger" :title="issueList.join('\n')">
      {{ issueCount }} {{ issueCount === 1 ? 'issue' : 'issues' }}
    </span>
    <span v-else class="badge bg-success-subtle text-success-emphasis">OK</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getCurrentValue, getCurrentErrors } from 'vue-fields-ms';

// PersonCard owns no data. It reads whatever container surrounds it (a FieldGroup,
// a RepeaterField row, …) through getCurrentValue / getCurrentErrors, so the same
// component can be dropped into any such context and stay in sync as fields change.
const name = getCurrentValue('name');
const email = getCurrentValue('email');
const errors = getCurrentErrors(); // the whole error bag of the surrounding context

const initials = computed(() => {
  return String(name.value ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
});

const issueList = computed((): string[] => {
  return Object.entries(errors.value).flatMap(([path, messages]) => {
    return messages.map((msg) => (path === '' ? msg : `${path}: ${msg}`));
  });
});
const issueCount = computed((): number => issueList.value.length);
const hasIssues = computed((): boolean => issueCount.value > 0);
</script>

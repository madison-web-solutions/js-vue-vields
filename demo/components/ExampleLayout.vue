<template>
  <div>
    <h1 class="h4 mb-2">{{ title }}</h1>
    <div class="text-muted mb-4" style="max-width: 65ch">
      <slot name="description" />
    </div>

    <div class="row g-4">
      <div class="col-xl-7">
        <div class="card mb-4">
          <div class="card-header fw-semibold">Live Form</div>
          <div class="card-body">
            <slot name="form" />
          </div>
        </div>

        <div class="card">
          <div class="card-header fw-semibold d-flex align-items-center">
            <span>Template Code</span>
            <button type="button" class="btn btn-sm btn-outline-secondary ms-auto py-0" @click="copyCode">
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <div class="card-body p-0">
            <pre class="mb-0 p-3" style="font-size: 0.78rem; max-height: 60vh; overflow: auto"><code>{{ code }}</code></pre>
          </div>
        </div>
      </div>

      <div class="col-xl-5">
        <div class="sticky-top" style="top: 1rem">
          <div class="card">
            <div class="card-header fw-semibold">Live Values</div>
            <div class="card-body p-2">
              <pre class="mb-0" style="font-size: 0.78rem; max-height: 70vh; overflow: auto">{{ formatted }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  title: string;
  code: string;
  values: unknown;
}>();

const formatted = computed(() => JSON.stringify(props.values, null, 2));

const copied = ref(false);

const copyCode = async () => {
  await navigator.clipboard.writeText(props.code);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1500);
};
</script>

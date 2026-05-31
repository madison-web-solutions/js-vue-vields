<template>
  <ExampleLayout title="Article Form" :code="articleCode" :values="liveVals">
    <template #description>
      <p class="mb-0">
        A realistic record-editing form wired to a mock API. It demonstrates the full
        lifecycle: <code>FieldGroup</code> bound with <code>v-model</code> and
        <code>v-model:errors</code>, loading a record, saving it, mapping server-side
        validation errors back onto the fields, and switching between edit and view modes via
        <code>:editMode</code>.
      </p>
    </template>

    <template #toolbar>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="form?.load()" :disabled="form?.loading">
          {{ form?.loading ? 'Loading…' : 'Load' }}
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="form?.reset()">Reset</button>
        <button type="button" class="btn btn-sm btn-primary" @click="form?.save()" :disabled="form?.saving">
          {{ form?.saving ? 'Saving…' : 'Save' }}
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary ms-auto" @click="form?.toggleMode()">
          {{ form?.editMode === 'edit' ? 'View mode' : 'Edit mode' }}
        </button>
      </div>

      <div v-if="form?.saveStatus === 'ok'" class="alert alert-success alert-dismissible mt-3 mb-0">
        Saved successfully.
        <button type="button" class="btn-close" @click="form?.dismissStatus()" />
      </div>
      <div v-if="form?.saveStatus === 'error'" class="alert alert-danger alert-dismissible mt-3 mb-0">
        Please fix the validation errors below before saving.
        <button type="button" class="btn-close" @click="form?.dismissStatus()" />
      </div>
    </template>

    <template #form>
      <ArticleExample ref="form" />
    </template>

    <template #aside>
      <div v-if="hasErrors" class="card border-danger">
        <div class="card-header fw-semibold text-danger">Validation Errors</div>
        <div class="card-body p-2">
          <pre class="mb-0 text-danger" style="font-size: 0.72rem">{{ JSON.stringify(form?.errors, null, 2) }}</pre>
        </div>
      </div>
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ExampleLayout from '../components/ExampleLayout.vue'
import ArticleExample from '../examples/ArticleExample.vue'
import articleCode from '../examples/ArticleExample.vue?raw'

const form = ref<InstanceType<typeof ArticleExample>>()

const liveVals = computed(() => form.value?.vals ?? {})
const hasErrors = computed(() => Object.keys(form.value?.errors ?? {}).length > 0)
</script>

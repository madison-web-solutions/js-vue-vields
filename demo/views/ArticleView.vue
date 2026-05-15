<template>
  <div>
    <div class="d-flex gap-2 mb-4 align-items-center flex-wrap">
      <h1 class="h4 mb-0 me-auto">Edit Article</h1>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="loadRecord" :disabled="loading">
        {{ loading ? 'Loading…' : 'Load' }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="resetRecord">Reset</button>
      <button type="button" class="btn btn-sm btn-primary" @click="saveRecord" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleMode">
        {{ editMode === 'edit' ? 'View mode' : 'Edit mode' }}
      </button>
    </div>

    <div v-if="saveStatus === 'ok'" class="alert alert-success alert-dismissible">
      Saved successfully.
      <button type="button" class="btn-close" @click="saveStatus = null" />
    </div>
    <div v-if="saveStatus === 'error'" class="alert alert-danger alert-dismissible">
      Please fix the validation errors below before saving.
      <button type="button" class="btn-close" @click="saveStatus = null" />
    </div>

    <div class="row g-4">
      <div class="col-xl-8">
        <FieldGroup v-model="vals" v-model:errors="errors" :editMode="editMode">

          <div class="card mb-3">
            <div class="card-header fw-semibold">Basic Info</div>
            <div class="card-body">
              <TextField name="title" label="Title" required class="mb-3" />
              <TextField name="slug" label="Slug" placeholder="auto-generated-from-title" class="mb-3" />
              <div class="row g-3">
                <SelectField name="status" label="Status" directory="statuses" class="col-sm-6 mb-3" />
                <DateTimeField name="published_at" label="Published At" class="col-sm-6 mb-3" />
              </div>
              <TokensField name="categories" label="Categories" directory="categories" :searchable="true" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Featured Image</div>
            <div class="card-body">
              <MediaField name="featured_image_id" label="Featured Image" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Content</div>
            <div class="card-body">
              <TextAreaField name="intro" label="Introduction" class="mb-3" />
              <HtmlField name="body" label="Body" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Content Blocks</div>
            <div class="card-body">
              <FlexibleContentField name="content_blocks" :sectionChoices="blockChoices">
                <template #text>
                  <HtmlField name="content" label="Content" />
                </template>
                <template #image>
                  <MediaField name="image_id" label="Image" class="mb-3" />
                  <TextField name="caption" label="Caption" />
                </template>
                <template #quote>
                  <TextAreaField name="text" label="Quote Text" class="mb-3" />
                  <TextField name="attribution" label="Attribution" />
                </template>
              </FlexibleContentField>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Links & Sidebar</div>
            <div class="card-body">
              <LinkField name="related_link" label="Related Link" class="mb-3" />
              <RepeaterField name="sidebar_items" label="Sidebar Items" subValuesType="compound" appendLabel="Add Item">
                <template #default>
                  <TextField name="label" label="Label" class="mb-2" />
                  <LinkField name="link" label="Link" />
                </template>
              </RepeaterField>
            </div>
          </div>

        </FieldGroup>
      </div>

      <div class="col-xl-4">
        <div class="sticky-top" style="top: 1rem">
          <div class="card mb-3">
            <div class="card-header fw-semibold">Form Data</div>
            <div class="card-body p-2">
              <pre class="mb-0" style="font-size: 0.72rem; max-height: 50vh; overflow: auto">{{ JSON.stringify(vals, null, 2) }}</pre>
            </div>
          </div>
          <div v-if="hasErrors" class="card border-danger">
            <div class="card-header fw-semibold text-danger">Validation Errors</div>
            <div class="card-body p-2">
              <pre class="mb-0 text-danger" style="font-size: 0.72rem">{{ JSON.stringify(errors, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { EditMode, MessageBag, Choosable } from 'vue-fields-ms'
import {
  FieldGroup,
  TextField,
  TextAreaField,
  SelectField,
  DateTimeField,
  TokensField,
  MediaField,
  HtmlField,
  FlexibleContentField,
  LinkField,
  RepeaterField,
} from 'vue-fields-ms'

const editMode = ref<EditMode>('edit')
const loading = ref(false)
const saving = ref(false)
const saveStatus = ref<'ok' | 'error' | null>(null)

const vals = ref<Record<string, unknown>>({
  title: '',
  slug: '',
  status: null,
  published_at: null,
  categories: [],
  featured_image_id: null,
  intro: '',
  body: '',
  related_link: null,
  content_blocks: [],
  sidebar_items: [],
})

const errors = ref<MessageBag>({})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)

const blockChoices: Choosable[] = [
  { key: 'text', label: 'Text Block' },
  { key: 'image', label: 'Image Block' },
  { key: 'quote', label: 'Quote Block' },
]

const toggleMode = () => {
  editMode.value = editMode.value === 'edit' ? 'view' : 'edit';
};

const loadRecord = async () => {
  loading.value = true;
  try {
    const resp = await fetch('/api/record');
    vals.value = await resp.json();
    errors.value = {};
    saveStatus.value = null;
  } finally {
    loading.value = false;
  }
};

const resetRecord = () => {
  vals.value = {
    title: '',
    slug: '',
    status: null,
    published_at: null,
    categories: [],
    featured_image_id: null,
    intro: '',
    body: '',
    related_link: null,
    content_blocks: [],
    sidebar_items: [],
  };
  errors.value = {};
  saveStatus.value = null;
};

const saveRecord = async () => {
  saving.value = true;
  saveStatus.value = null;
  try {
    const resp = await fetch('/api/record', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vals.value),
    });
    const result = await resp.json();
    if (result.ok) {
      errors.value = {};
      saveStatus.value = 'ok';
    } else {
      errors.value = result.errors || {};
      saveStatus.value = 'error';
    }
  } finally {
    saving.value = false;
  }
};

onMounted(loadRecord)
</script>

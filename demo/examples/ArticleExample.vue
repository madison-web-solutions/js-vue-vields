<template>
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
        <HtmlField name="body" label="Body" tables />
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header fw-semibold">Content Blocks</div>
      <div class="card-body">
        <FlexibleContentField name="content_blocks" :sectionChoices="blockChoices">
          <template #text>
            <HtmlField name="content" label="Content" tables />
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
      <div class="card-header fw-semibold">Links &amp; Sidebar</div>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const blankRecord = (): Record<string, unknown> => ({
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

const vals = ref<Record<string, unknown>>(blankRecord())
const errors = ref<MessageBag>({})

const blockChoices: Choosable[] = [
  { key: 'text', label: 'Text Block' },
  { key: 'image', label: 'Image Block' },
  { key: 'quote', label: 'Quote Block' },
]

const toggleMode = () => {
  editMode.value = editMode.value === 'edit' ? 'view' : 'edit';
};

// Load the record from the mock API.
const load = async () => {
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

const reset = () => {
  vals.value = blankRecord();
  errors.value = {};
  saveStatus.value = null;
};

// Save back to the mock API, mapping any returned validation errors onto the form.
const save = async () => {
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

const dismissStatus = () => { saveStatus.value = null; };

onMounted(load)

// Exposed so the page's toolbar can drive the load/save lifecycle and the side panels can
// show the live values and validation errors.
defineExpose({ vals, errors, editMode, loading, saving, saveStatus, load, reset, save, toggleMode, dismissStatus });
</script>

<template>
  <div>
    <div v-if="status === 'ok'" class="alert alert-success alert-dismissible">
      Submitted successfully.
      <button type="button" class="btn-close" @click="status = null" />
    </div>
    <div v-if="status === 'error'" class="alert alert-danger alert-dismissible">
      Please fix the errors below.
      <button type="button" class="btn-close" @click="status = null" />
    </div>

    <FieldGroup v-model="vals" v-model:errors="errors">
      <TextField name="full_name" label="Full name" required class="mb-3" />
      <TextField name="email" label="Email" inputType="email" class="mb-3" />

      <!-- inline mode: the file is base64-encoded and submitted with the form -->
      <FileUploadField
        name="cv"
        label="CV (inline)"
        mode="inline"
        accept=".pdf,.doc,.docx"
        :maxSize="5 * 1024 * 1024"
        help="PDF or Word, up to 5 MB — submitted inline with the form."
        class="mb-3"
      />

      <!-- upload mode: the file is sent to the server on selection, which returns a token -->
      <FileUploadField
        name="photos"
        label="Photos (upload mode)"
        mode="upload"
        multiple
        accept="image/*"
        :maxFiles="3"
        help="Up to 3 images — uploaded immediately, with progress."
        class="mb-3"
      />

      <!-- a file field nested in a repeater — works because the value is just a token -->
      <RepeaterField name="references" subValuesType="compound" appendLabel="Add Reference">
        <template #default>
          <TextField name="name" label="Referee name" class="mb-2" />
          <FileUploadField name="letter" label="Reference letter" mode="inline" accept=".pdf" />
        </template>
      </RepeaterField>
    </FieldGroup>

    <div class="d-flex align-items-center gap-3 mt-3">
      <div class="btn-group btn-group-sm" role="group" aria-label="Transport">
        <input type="radio" class="btn-check" id="t-json" value="json" v-model="transport" />
        <label class="btn btn-outline-secondary" for="t-json">JSON</label>
        <input type="radio" class="btn-check" id="t-multipart" value="multipart" v-model="transport" />
        <label class="btn btn-outline-secondary" for="t-multipart">multipart</label>
      </div>
      <button type="button" class="btn btn-sm btn-primary" @click="submit" :disabled="submitting">
        {{ submitting ? 'Submitting…' : 'Submit' }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="reset">Reset</button>
    </div>

    <!-- The wire format for the chosen transport. Submit always posts the JSON envelope; the form
         value itself (shown in "Live Values") only ever holds small tokens. -->
    <div class="card mt-3">
      <div class="card-header fw-semibold small">Request preview ({{ transport }})</div>
      <div class="card-body p-2">
        <pre class="mb-0" style="font-size: 0.72rem; max-height: 35vh; overflow: auto">{{ preview }}</pre>
      </div>
    </div>

    <div v-if="received" class="card mt-3">
      <div class="card-header fw-semibold small">Server received (files reassembled into the tree)</div>
      <div class="card-body p-2">
        <pre class="mb-0" style="font-size: 0.72rem; max-height: 25vh; overflow: auto">{{ JSON.stringify(received, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { MessageBag } from 'vue-fields-ms';
import { FieldGroup, TextField, FileUploadField, RepeaterField, useUploadedFiles } from 'vue-fields-ms';

// toFormData / toJson reunite the tokens stored in the form value with their cached files, so the
// whole form (including the uploaded files) can be submitted in one request.
const { toFormData, toJson } = useUploadedFiles();

const emptyVals = (): Record<string, unknown> => ({
  full_name: '',
  email: '',
  cv: null,
  photos: [],
  references: [],
});

const vals = ref<Record<string, unknown>>(emptyVals());
const errors = ref<MessageBag>({});
const transport = ref<'json' | 'multipart'>('json');
const preview = ref('');
const received = ref<unknown>(null);
const status = ref<'ok' | 'error' | null>(null);
const submitting = ref(false);

// Rebuild the wire-format preview whenever the value or chosen transport changes.
const updatePreview = async () => {
  if (transport.value === 'json') {
    // Truncate each file's base64 payload so the structure stays readable, then pretty-print.
    const envelope = JSON.parse(await toJson(vals.value));
    for (const meta of Object.values(envelope.files ?? {}) as { base64_contents?: string }[]) {
      if (typeof meta.base64_contents === 'string' && meta.base64_contents.length > 24) {
        meta.base64_contents = `${meta.base64_contents.slice(0, 16)}… (${meta.base64_contents.length} chars)`;
      }
    }
    preview.value = JSON.stringify(envelope, null, 2);
  } else {
    const fd = toFormData(vals.value);
    const lines: string[] = [];
    for (const [key, value] of fd.entries()) {
      lines.push(value instanceof File ? `${key} = «File ${value.name} (${value.size} bytes)»` : `${key} = ${value}`);
    }
    preview.value = lines.join('\n');
  }
};

watch([() => JSON.stringify(vals.value), transport], updatePreview, { immediate: true });

const reset = () => {
  vals.value = emptyVals();
  errors.value = {};
  received.value = null;
  status.value = null;
};

const submit = async () => {
  submitting.value = true;
  status.value = null;
  try {
    const body = await toJson(vals.value);
    const resp = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const result = await resp.json();
    received.value = result.received ?? null;
    if (result.ok) {
      errors.value = {};
      status.value = 'ok';
    } else {
      errors.value = result.errors || {};
      status.value = 'error';
    }
  } finally {
    submitting.value = false;
  }
};

defineExpose({ vals });
</script>

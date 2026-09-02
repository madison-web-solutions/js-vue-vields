<template>
  <ExampleLayout title="All Fields Reference" :code="allFieldsCode" :values="liveVals">
    <template #description>
      <p class="mb-0">
        Every field the library ships, grouped by category, all bound to one
        <code>FieldGroup</code>. Use the error simulator on the right to inject a validation
        message onto each field (or edit the JSON directly) to see how every field renders its
        errors, and toggle edit / view mode with the button above.
      </p>
    </template>

    <template #toolbar>
      <div class="d-flex gap-2 align-items-center">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="form?.toggleMode()">
          {{ form?.editMode === 'edit' ? 'View mode' : 'Edit mode' }}
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="resetVals">Reset</button>
        <!-- mousedown.prevent stops the button taking focus itself, so focusNext() can still see
             which field the user was in. Without it document.activeElement is always this button
             and every click restarts from the first field. -->
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @mousedown.prevent
          @click="form?.focusNext()"
        >
          Focus next field
        </button>
      </div>
    </template>

    <template #form>
      <AllFieldsExample ref="form" />
    </template>

    <template #aside>
      <div class="card">
        <div class="card-header d-flex align-items-center flex-wrap gap-2">
          <span class="fw-semibold me-auto">Validation Errors</span>
          <button type="button" class="btn btn-sm btn-outline-warning py-0" @click="toggleErrors">
            {{ hasErrors ? 'Clear' : 'Simulate' }}
          </button>
          <button type="button" class="btn btn-sm btn-primary py-0" @click="applyErrors">Apply</button>
        </div>
        <div class="card-body p-2">
          <textarea
            v-model="errorsText"
            class="form-control font-monospace"
            rows="14"
            spellcheck="false"
            style="font-size: 0.72rem"
          ></textarea>
          <div v-if="parseError" class="small mt-1 text-danger">{{ parseError }}</div>
          <div class="form-text mt-1">Edit the JSON directly, then click Apply.</div>
        </div>
      </div>
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MessageBag } from 'vue-fields-ms'
import ExampleLayout from '../components/ExampleLayout.vue'
import AllFieldsExample from '../examples/AllFieldsExample.vue'
import allFieldsCode from '../examples/AllFieldsExample.vue?raw'
import { makeFakeErrors } from '../fakeErrors'

const form = ref<InstanceType<typeof AllFieldsExample>>()

const liveVals = computed(() => form.value?.vals ?? {})
const hasErrors = computed(() => Object.keys(form.value?.errors ?? {}).length > 0)

// Editable JSON buffer for the Validation Errors panel. It is synced to the form's errors
// only when we Simulate / Clear / Apply — not on every field keystroke — so manual edits
// aren't clobbered while typing.
const errorsText = ref('{}');
const parseError = ref<string | null>(null);

const syncText = (bag: MessageBag) => {
  errorsText.value = JSON.stringify(bag, null, 2);
  parseError.value = null;
};

const toggleErrors = () => {
  if (hasErrors.value) {
    form.value?.setErrors({});
    syncText({});
  } else {
    const bag = makeFakeErrors(form.value?.vals ?? {}, {
      multiValueKeys: ['checkboxes', 'checkboxesMap', 'tokensStatic', 'tokensDir'],
      leafObjectKeys: ['link'],
    });
    form.value?.setErrors(bag);
    form.value?.setEditMode('edit');
    syncText(bag);
  }
};

const applyErrors = () => {
  try {
    const parsed = JSON.parse(errorsText.value);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      parseError.value = 'Expected a JSON object mapping field paths to arrays of messages.';
      return;
    }
    form.value?.setErrors(parsed as MessageBag);
    form.value?.setEditMode('edit');
    parseError.value = null;
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'Invalid JSON.';
  }
};

const resetVals = () => {
  form.value?.reset();
  syncText({});
};
</script>

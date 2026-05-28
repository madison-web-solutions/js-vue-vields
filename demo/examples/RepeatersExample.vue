<template>
  <FieldGroup v-model="vals">
    <section class="mb-4">
      <h6 class="text-uppercase text-muted small fw-bold">1. RepeaterField &mdash; rows (vertical flow)</h6>
      <p class="text-muted small">Default layout. Each row spans the full width and stacks vertically.</p>
      <RepeaterField name="people" appendLabel="Add Person">
        <TextField name="name" label="Name" class="mb-2" />
        <TextField name="email" label="Email" class="mb-2" />
        <SelectField name="role" label="Role" :choices="roleChoices" />
      </RepeaterField>
    </section>

    <section class="mb-4">
      <h6 class="text-uppercase text-muted small fw-bold">2. RepeaterField &mdash; cards (horizontal flow)</h6>
      <p class="text-muted small">Set <code>colCssClass</code> to a sub-12 Bootstrap column and <code>horizontalFlow</code> to lay rows out side by side.</p>
      <RepeaterField
        name="people"
        appendLabel="Add Person"
        colCssClass="col-md-6"
        horizontalFlow
      >
        <TextField name="name" label="Name" class="mb-2" />
        <TextField name="email" label="Email" class="mb-2" />
        <SelectField name="role" label="Role" :choices="roleChoices" />
      </RepeaterField>
    </section>

    <section class="mb-4">
      <h6 class="text-uppercase text-muted small fw-bold">3. RepeaterTableField</h6>
      <p class="text-muted small">A compact table view. Define <code>cols</code> and provide a slot per column. Omit labels on the sub-fields &mdash; the column headers are the labels.</p>
      <RepeaterTableField name="people" appendLabel="Add Person" :cols="tableCols">
        <template #name><TextField name="name" /></template>
        <template #email><TextField name="email" /></template>
        <template #role><SelectField name="role" :choices="roleChoices" /></template>
      </RepeaterTableField>
    </section>

    <section>
      <h6 class="text-uppercase text-muted small fw-bold">4. Custom layout via FieldArray</h6>
      <p class="text-muted small">FieldArray is renderless. Compose any markup you like around each row using <code>FieldArrayItem</code> + <code>FieldGroup</code>, and wire up your own add / delete buttons.</p>
      <FieldArray name="people">
        <template #default="{ loopItems }">
          <div
            v-for="item in loopItems"
            :key="item.index"
            class="d-flex gap-3 mb-3 align-items-start p-3 border rounded bg-light"
          >
            <div
              class="badge bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style="width: 2rem; height: 2rem"
            >
              {{ item.index + 1 }}
            </div>
            <div class="flex-grow-1">
              <FieldArrayItem :index="item.index">
                <FieldGroup>
                  <div class="row g-2">
                    <TextField name="name" label="Name" class="col-md-4" />
                    <TextField name="email" label="Email" class="col-md-4" />
                    <SelectField name="role" label="Role" :choices="roleChoices" class="col-md-4" />
                  </div>
                </FieldGroup>
              </FieldArrayItem>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="item.deleteRow">
              Remove
            </button>
          </div>
        </template>
        <template #afterLoop="{ canAddRow, appendRow }">
          <button
            v-if="canAddRow"
            type="button"
            class="btn btn-sm btn-primary"
            @click="appendRow"
          >
            + Add Person
          </button>
        </template>
      </FieldArray>
    </section>
  </FieldGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  FieldGroup,
  TextField,
  SelectField,
  RepeaterField,
  RepeaterTableField,
  FieldArray,
  FieldArrayItem,
} from 'vue-fields-ms';
import type { Choosable, RepeaterTableColOpts } from 'vue-fields-ms';

// One shared array — all four components below read and write `vals.people`,
// so edits in any of them are reflected in the others in real time.
const vals = ref({
  people: [
    { name: 'Ada Lovelace', email: 'ada@example.com', role: 'owner' },
    { name: 'Alan Turing', email: 'alan@example.com', role: 'editor' },
  ],
});

const roleChoices: Choosable[] = [
  { key: 'owner', label: 'Owner' },
  { key: 'editor', label: 'Editor' },
  { key: 'viewer', label: 'Viewer' },
];

const tableCols: RepeaterTableColOpts[] = [
  { name: 'name', label: 'Name' },
  { name: 'email', label: 'Email' },
  { name: 'role', label: 'Role' },
];

// Exposed only so the demo's "Live Values" panel can display this form's data.
defineExpose({ vals });
</script>

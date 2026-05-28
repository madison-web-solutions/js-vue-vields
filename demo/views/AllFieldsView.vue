<template>
  <div>
    <div class="d-flex gap-2 mb-4 align-items-center">
      <h1 class="h4 mb-0 me-auto">All Fields Reference</h1>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleMode">
        {{ editMode === 'edit' ? 'View mode' : 'Edit mode' }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="resetVals">Reset</button>
    </div>

    <div class="row g-4">
      <div class="col-xl-8">
        <FieldGroup v-model="vals" v-model:errors="errors" :editMode="editMode">

          <div class="card mb-3">
            <div class="card-header fw-semibold">Text Fields</div>
            <div class="card-body">
              <TextField name="text" label="TextField" placeholder="Plain text…" class="mb-3" />
              <TextAreaField name="textArea" label="TextAreaField" class="mb-3" />
              <PasswordField name="password" label="PasswordField" :minStrength="3" class="mb-3" />
              <TextField name="maxChars" label="TextField with max chars" :max="50" class="mb-3" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Numeric Fields</div>
            <div class="card-body">
              <NumberField name="number" label="NumberField" class="mb-3" />
              <NumberField name="numberRange" label="NumberField (min/max)" :min="0" :max="100" class="mb-3" />
              <CurrencyField name="currency" label="CurrencyField" class="mb-3" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Date &amp; Time Fields</div>
            <div class="card-body">
              <DateField name="date" label="DateField" class="mb-3" />
              <TimeField name="time" label="TimeField" class="mb-3" />
              <DateTimeField name="dateTime" label="DateTimeField" class="mb-3" />
              <TimestampField name="timestamp" label="TimestampField" class="mb-3" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Boolean Fields</div>
            <div class="card-body">
              <CheckboxField name="checkbox" label="CheckboxField" class="mb-3" />
              <ToggleField name="toggle" label="ToggleField" class="mb-3" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Choice Fields</div>
            <div class="card-body">
              <SelectField name="select" label="SelectField (static)" :choices="colourChoices" class="mb-3" />
              <SelectField name="selectDir" label="SelectField (directory)" directory="statuses" class="mb-3" />
              <CustomSelectField name="customSelect" label="CustomSelectField (colour swatches)" :choices="colourChoices" class="mb-3">
                <template #default="{ choice }">
                  <span class="d-inline-block rounded border me-2" :style="{ width: '1rem', height: '1rem', background: String(choice.key), verticalAlign: '-2px' }"></span>
                  {{ choice.label }}
                </template>
              </CustomSelectField>
              <RadioField name="radio" label="RadioField" :choices="colourChoices" class="mb-3" />
              <CheckboxesField name="checkboxes" label="CheckboxesField" :choices="colourChoices" class="mb-3" />
              <TokensField name="tokensStatic" label="TokensField (static)" :choices="colourChoices" class="mb-3" />
              <TokensField name="tokensDir" label="TokensField (searchable, directory)" directory="categories" :searchable="true" class="mb-3" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Media &amp; Links</div>
            <div class="card-body">
              <MediaField name="media" label="MediaField" class="mb-3" />
              <LinkField name="link" label="LinkField" class="mb-3" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Rich Text</div>
            <div class="card-body">
              <HtmlField name="html" label="HtmlField" />
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Repeater Fields</div>
            <div class="card-body">
              <RepeaterField name="simpleRepeater" label="RepeaterField (simple strings)" subValuesType="simple" appendLabel="Add Item" class="mb-4">
                <template #default="{ index }">
                  <TextField :index="index" label="Item" />
                </template>
              </RepeaterField>
              <RepeaterField name="compoundRepeater" label="RepeaterField (compound)" subValuesType="compound" appendLabel="Add Row">
                <template #default>
                  <TextField name="title" label="Title" class="mb-2" />
                  <NumberField name="count" label="Count" />
                </template>
              </RepeaterField>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header fw-semibold">Bottom-of-page CustomSelect (flip-up test)</div>
            <div class="card-body">
              <CustomSelectField name="customSelectBottom" label="Should flip upward when viewport is short" :choices="colourChoices">
                <template #default="{ choice }">
                  <span class="d-inline-block rounded border me-2" :style="{ width: '1rem', height: '1rem', background: String(choice.key), verticalAlign: '-2px' }"></span>
                  {{ choice.label }}
                </template>
              </CustomSelectField>
            </div>
          </div>

        </FieldGroup>
      </div>

      <div class="col-xl-4">
        <div class="sticky-top" style="top: 1rem">
          <div class="card">
            <div class="card-header fw-semibold">Live Values</div>
            <div class="card-body p-2">
              <pre class="mb-0" style="font-size: 0.72rem; max-height: 70vh; overflow: auto">{{ JSON.stringify(vals, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EditMode, MessageBag, Choosable } from 'vue-fields-ms'
import {
  FieldGroup,
  TextField,
  TextAreaField,
  PasswordField,
  NumberField,
  CurrencyField,
  DateField,
  TimeField,
  DateTimeField,
  TimestampField,
  CheckboxField,
  ToggleField,
  SelectField,
  CustomSelectField,
  RadioField,
  CheckboxesField,
  TokensField,
  MediaField,
  LinkField,
  HtmlField,
  RepeaterField,
} from 'vue-fields-ms'

const editMode = ref<EditMode>('edit')
const vals = ref<Record<string, unknown>>({})
const errors = ref<MessageBag>({})

const colourChoices: Choosable[] = [
  { key: 'red', label: 'Red' },
  { key: 'green', label: 'Green' },
  { key: 'blue', label: 'Blue' },
  { key: 'yellow', label: 'Yellow' },
  { key: 'purple', label: 'Purple' },
]

const toggleMode = () => {
  editMode.value = editMode.value === 'edit' ? 'view' : 'edit';
};

const resetVals = () => {
  vals.value = {};
  errors.value = {};
};
</script>

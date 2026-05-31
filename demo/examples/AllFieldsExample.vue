<template>
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
        <CustomRadioField name="customRadio" label="CustomRadioField (button group)" :choices="planChoices" class="mb-3">
          <template #default="{ choice, selected }">
            <button type="button" class="btn w-100 py-3" :class="selected ? 'btn-primary' : 'btn-outline-primary'">
              <span class="fw-semibold">{{ choice.label }}</span>
            </button>
          </template>
        </CustomRadioField>
        <CheckboxesField name="checkboxes" label="CheckboxesField (array value)" :choices="colourChoices" class="mb-3" />
        <CheckboxesField name="checkboxesMap" label="CheckboxesField (booleans-map value)" valueIs="object" :choices="colourChoices" class="mb-3" />
        <TokensField name="tokensStatic" label="TokensField (static)" :choices="colourChoices" class="mb-3" />
        <TokensField name="tokensDir" label="TokensField (searchable, directory)" directory="categories" :searchable="true" class="mb-3" />
        <SearchField name="search" label="SearchField (searchable, directory)" directory="categories" class="mb-3" />
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
          <template #default>
            <TextField label="Item" />
          </template>
        </RepeaterField>
        <RepeaterField name="compoundRepeater" label="RepeaterField (compound)" subValuesType="compound" appendLabel="Add Row" class="mb-4">
          <template #default>
            <TextField name="title" label="Title" class="mb-2" />
            <NumberField name="count" label="Count" />
          </template>
        </RepeaterField>
        <RepeaterTableField name="tableRepeater" label="RepeaterTableField" appendLabel="Add Row" :cols="tableCols">
          <template #product><TextField name="product" /></template>
          <template #qty><NumberField name="qty" /></template>
          <template #price><CurrencyField name="price" /></template>
        </RepeaterTableField>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EditMode, MessageBag, Choosable, RepeaterTableColOpts } from 'vue-fields-ms'
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
  CustomRadioField,
  CheckboxesField,
  TokensField,
  SearchField,
  MediaField,
  LinkField,
  HtmlField,
  RepeaterField,
  RepeaterTableField,
} from 'vue-fields-ms'

// A representative, fully-shaped set of values. Every field key is present (mostly empty)
// so "Simulate errors" can attach a message to each, and the two repeaters start with a
// couple of rows so their row-level and sub-field errors have somewhere to render.
const makeSeed = (): Record<string, unknown> => ({
  text: 'Some text',
  textArea: '',
  password: '',
  maxChars: '',
  number: 42,
  numberRange: null,
  currency: null,
  date: null,
  time: null,
  dateTime: null,
  timestamp: null,
  checkbox: false,
  toggle: false,
  select: null,
  selectDir: null,
  customSelect: null,
  radio: null,
  customRadio: 'pro',
  checkboxes: ['green', 'blue'],
  checkboxesMap: { red: true, green: false, blue: true, yellow: false, purple: false },
  tokensStatic: ['red', 'blue'],
  tokensDir: [1, 3],
  search: null,
  media: null,
  link: null,
  html: '',
  simpleRepeater: ['First item', 'Second item'],
  compoundRepeater: [
    { title: 'Alpha', count: 1 },
    { title: 'Beta', count: 2 },
  ],
  tableRepeater: [
    { product: 'Widget', qty: 3, price: 9.99 },
    { product: 'Gadget', qty: 1, price: 19.5 },
  ],
  customSelectBottom: null,
});

const editMode = ref<EditMode>('edit')
const vals = ref<Record<string, unknown>>(makeSeed())
const errors = ref<MessageBag>({})

const colourChoices: Choosable[] = [
  { key: 'red', label: 'Red' },
  { key: 'green', label: 'Green' },
  { key: 'blue', label: 'Blue' },
  { key: 'yellow', label: 'Yellow' },
  { key: 'purple', label: 'Purple' },
]

const planChoices: Choosable[] = [
  { key: 'basic', label: 'Basic' },
  { key: 'pro', label: 'Pro' },
  { key: 'enterprise', label: 'Enterprise' },
]

const tableCols: RepeaterTableColOpts[] = [
  { name: 'product', label: 'Product' },
  { name: 'qty', label: 'Qty' },
  { name: 'price', label: 'Price' },
]

const toggleMode = () => {
  editMode.value = editMode.value === 'edit' ? 'view' : 'edit';
};

const setErrors = (bag: MessageBag) => { errors.value = bag; };
const setEditMode = (mode: EditMode) => { editMode.value = mode; };

const reset = () => {
  vals.value = makeSeed();
  errors.value = {};
};

// Exposed so the page's toolbar and error-simulator panel can drive this form.
defineExpose({ vals, errors, editMode, reset, toggleMode, setErrors, setEditMode });
</script>

<style scoped>
/* CustomRadioField is headless — the demo lays its items out as a Bootstrap button group of
   equal-width buttons, and draws a red box around the group when it has a whole-field error
   (matching the CheckboxesField group treatment). */
:deep(.vfm-custom-radio) {
  display: flex;
  gap: 0.5rem;
}
:deep(.vfm-custom-radio-item) {
  flex: 1 1 0;
  cursor: pointer;
}
:deep(.vfm-custom-radio.is-invalid) {
  outline: 1px solid var(--bs-danger);
  outline-offset: 0.375rem;
  border-radius: var(--bs-border-radius);
}
</style>

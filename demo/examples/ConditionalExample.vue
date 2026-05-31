<template>
  <FieldGroup v-model="vals">

    <!--
      1. CONDITIONAL FIELDS (top level)
      Because the whole form is bound to `vals` via FieldGroup's v-model, you can read any
      value straight off `vals` in the template and drive a plain v-if with it. No special
      API — it's just Vue reactivity over the model object.
    -->
    <section class="mb-4">
      <h6 class="text-uppercase text-muted small fw-bold">1. Conditional fields</h6>

      <ToggleField name="existing_account" label="I already have an account" class="mb-2" />
      <!-- Only shown when the toggle above is on -->
      <TextField
        v-if="vals.existing_account"
        name="account_no"
        label="Account number"
        class="mb-2"
      />

      <SelectField name="referral" label="How did you hear about us?" :choices="referralChoices" class="mb-2" />
      <!-- The "please specify" box only appears for the "other" option -->
      <TextField
        v-if="vals.referral === 'other'"
        name="referral_other"
        label="Please specify"
      />
    </section>

    <!--
      2. DYNAMIC PROPS
      Any prop can be bound to an expression, so it can react to other fields. Here the label
      and placeholder of the amount field follow the chosen currency, the region choices
      depend on the chosen country, and the VAT number is required only when "VAT registered"
      is ticked.
    -->
    <section class="mb-4">
      <h6 class="text-uppercase text-muted small fw-bold">2. Dynamic props</h6>

      <SelectField name="currency" label="Currency" :choices="currencyChoices" class="mb-2" />
      <NumberField
        name="amount"
        :label="`Amount (${vals.currency ?? '—'})`"
        :placeholder="amountPlaceholder"
        class="mb-2"
      />

      <SelectField name="country" label="Country" :choices="countryChoices" class="mb-2" />
      <!-- choices recomputed from the selected country -->
      <SelectField name="region" label="Region" :choices="regionChoices" class="mb-2" />

      <CheckboxField name="vat_registered" label="VAT registered" class="mb-2" />
      <!-- required toggles with the checkbox above -->
      <TextField name="vat_number" label="VAT number" :required="vals.vat_registered === true" />
    </section>

    <!--
      3. CONDITIONAL LOGIC INSIDE A REPEATER ROW
      Inside a RepeaterField you don't have a single `vals` for the row — each row has its own
      values. Use the default slot to get them: <template #default="{ subVals }">. `subVals` is
      the current row's value object (RepeaterField is `compound` by default), so you drive the
      per-row conditions off `subVals` exactly like you'd use `vals` at the top level.
    -->
    <section>
      <h6 class="text-uppercase text-muted small fw-bold">3. Conditional logic inside a repeater row</h6>
      <p class="text-muted small">Each contact reveals a different field depending on the chosen method.</p>

      <RepeaterField name="contacts" appendLabel="Add Contact">
        <!--
          Use `subVals?.` (optional chaining): a freshly added row starts out null until a
          child field writes to it, so reading `subVals.method` directly would throw on a
          brand-new row.
        -->
        <template #default="{ subVals }">
          <TextField name="name" label="Name" class="mb-2" />
          <SelectField name="method" label="Preferred contact method" :choices="methodChoices" class="mb-2" />

          <TextField
            v-if="subVals?.method === 'email'"
            name="email"
            label="Email address"
          />
          <TextField
            v-if="subVals?.method === 'phone'"
            name="phone"
            label="Phone number"
          />
          <TextAreaField
            v-if="subVals?.method === 'post'"
            name="address"
            label="Postal address"
          />
        </template>
      </RepeaterField>
    </section>

  </FieldGroup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FieldGroup,
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
  ToggleField,
  CheckboxField,
  RepeaterField,
} from 'vue-fields-ms';
import type { Choosable } from 'vue-fields-ms';

const vals = ref<Record<string, any>>({
  existing_account: false,
  account_no: '',
  referral: 'search',
  referral_other: '',
  currency: 'GBP',
  amount: null,
  country: 'GB',
  region: '',
  vat_registered: false,
  vat_number: '',
  contacts: [
    { name: 'Ada Lovelace', method: 'email', email: 'ada@example.com' },
  ],
});

const referralChoices: Choosable[] = [
  { key: 'search', label: 'Search engine' },
  { key: 'friend', label: 'Word of mouth' },
  { key: 'social', label: 'Social media' },
  { key: 'other', label: 'Other' },
];

const currencyChoices: Choosable[] = [
  { key: 'GBP', label: 'Pounds (GBP)' },
  { key: 'USD', label: 'Dollars (USD)' },
  { key: 'EUR', label: 'Euros (EUR)' },
];

// A dynamic prop derived from another field's value.
const amountPlaceholder = computed(() => {
  const symbol = { GBP: '£', USD: '$', EUR: '€' }[vals.value.currency as string] ?? '';
  return `${symbol}0.00`;
});

const countryChoices: Choosable[] = [
  { key: 'GB', label: 'United Kingdom' },
  { key: 'US', label: 'United States' },
];

// Choices for one field computed from the value of another.
const regionsByCountry: Record<string, Choosable[]> = {
  GB: [
    { key: 'england', label: 'England' },
    { key: 'scotland', label: 'Scotland' },
    { key: 'wales', label: 'Wales' },
    { key: 'ni', label: 'Northern Ireland' },
  ],
  US: [
    { key: 'ca', label: 'California' },
    { key: 'ny', label: 'New York' },
    { key: 'tx', label: 'Texas' },
  ],
};
const regionChoices = computed(() => regionsByCountry[vals.value.country as string] ?? []);

const methodChoices: Choosable[] = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'post', label: 'Post' },
];

// Exposed only so the demo's "Live Values" panel can display this form's data.
defineExpose({ vals });
</script>

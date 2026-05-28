<template>
  <CompoundField v-bind="pickPropsFor(CompoundField, props)" v-model="modelValue" v-model:errors="errors">
    <template #default="{ subVals }">
      <div :class="border ? 'border rounded p-3' : ''">
        <div class="row g-3">
          <TextField name="add1" label="Line 1" :required="required" :disabled="disabled" :autocomplete="autocomplete.add1" :class="colCssClass" />
          <TextField name="add2" label="Line 2" :disabled="disabled" :autocomplete="autocomplete.add2" :class="colCssClass" />
          <TextField name="city" label="City" :required="required" :disabled="disabled" :autocomplete="autocomplete.city" :class="colCssClass" />
          <TextField name="county" :label="countyLabel(subVals.country_code)" :disabled="disabled" :autocomplete="autocomplete.county" :class="colCssClass" />
          <TextField name="postcode" :label="postcodeLabel(subVals.country_code)" :disabled="disabled" :autocomplete="autocomplete.postcode" :class="colCssClass" />
          <SelectField name="country_code" label="Country" directory="country" :required="required" :disabled="disabled" :autocomplete="autocomplete.country" :class="colCssClass" />
        </div>
      </div>
    </template>
  </CompoundField>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FieldProps, CompoundFormValue, MessageBag } from 'vue-fields-ms';
import { CompoundField, TextField, SelectField, pickPropsFor } from 'vue-fields-ms';

const props = defineProps<Omit<FieldProps, 'modelValue' | 'errors'> & {
  singleCol?: boolean;
  border?: boolean;
}>();

const modelValue = defineModel<CompoundFormValue>();
const errors = defineModel<MessageBag>('errors');

const colCssClass = computed(() => props.singleCol ? 'col-12' : 'col-md-6');

// Wire HTML address-autofill section tokens to each sub-field. When the parent
// passes an autocomplete section name (e.g. "shipping"), each sub-field gets a
// scoped token — "shipping address-line1", "shipping postal-code", etc. — so the
// browser can autofill shipping and billing addresses independently. Passing
// "off" disables autofill across the whole component.
const autocomplete = computed(() => {
  const prefix = props.autocomplete;
  const token = (name: string): string => {
    if (prefix === 'off') return 'off';
    if (prefix) return `${prefix} ${name}`;
    return name;
  };
  return {
    add1: token('address-line1'),
    add2: token('address-line2'),
    city: token('address-level2'),
    county: token('address-level1'),
    postcode: token('postal-code'),
    country: token('country'),
  };
});

const countyLabel = (countryCode: unknown): string => {
  return countryCode === 'GB' ? 'County' : 'County / State / Province';
};

const postcodeLabel = (countryCode: unknown): string => {
  return countryCode === 'GB' ? 'Postcode' : 'Postal / Zip Code';
};
</script>

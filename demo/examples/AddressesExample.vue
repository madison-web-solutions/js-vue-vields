<template>
  <FieldGroup v-model="vals">
    <AddressField name="shipping" label="Shipping Address" autocomplete="shipping" required class="mb-4" />

    <AddressField name="billing" label="Billing Address" autocomplete="billing" singleCol border class="mb-4" />

    <RepeaterField name="branches" label="Other Branch Offices" appendLabel="Add Branch">
      <TextField name="branch_name" label="Branch Name" class="mb-3" />
      <AddressField name="address" label="Address" border />
    </RepeaterField>
  </FieldGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FieldGroup, TextField, RepeaterField } from 'vue-fields-ms';
import AddressField from '../components/AddressField.vue';

const blankAddress = () => ({
  add1: '',
  add2: '',
  city: '',
  county: '',
  postcode: '',
  country_code: 'GB',
});

const vals = ref({
  shipping: blankAddress(),
  billing: blankAddress(),
  branches: [
    {
      branch_name: 'Head Office',
      address: {
        add1: '10 Downing Street',
        add2: '',
        city: 'London',
        county: 'Greater London',
        postcode: 'SW1A 2AA',
        country_code: 'GB',
      },
    },
  ],
});

// Exposed only so the demo's "Live Values" panel can display this form's data.
defineExpose({ vals });
</script>

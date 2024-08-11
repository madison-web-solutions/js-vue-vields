<template>
  <CompoundField :required="required" fieldTypeSlug="address" class="col-12">
    <div class="card">
      <div class="card-body">
        <div class="row gy-2 gx-3">
          <TextField
            name="add1"
            label="Line 1"
            :required="required"
            class="col-12"
          />
          <TextField
            name="add2"
            label="Line 2"
            :required="false"
            class="col-12"
          />
          <TextField
            name="city"
            label="City"
            :required="required"
            class="col-md-6"
          />
          <TextField
            name="county"
            label="County"
            :required="false"
            class="col-md-6"
          />
          <TextField
            name="postcode"
            label="Postcode"
            :required="required"
            class="col-md-6"
          />
          <CountryField
            name="country"
            label="Country"
            :required="required"
            class="col-md-6"
          />
        </div>
      </div>
    </div>
  </CompoundField>
</template>

<script setup lang="ts">
import { commonProps, CompoundField, TextField } from "vue-fields-ms";
import CountryField from "./CountryField.vue";

const props = defineProps({
  required: commonProps.required,
});
</script>

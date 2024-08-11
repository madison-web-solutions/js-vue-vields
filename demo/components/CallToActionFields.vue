<template>
  <div>
    <div class="row g-3 mb-3">
      <SelectField
        label="Slide Type"
        name="slide_type"
        :choices="slideTypeChoices"
        :required="true"
        class="col-md"
      />
    </div>
    <template v-if="slideType == 'structured'">
      <TextField label="Pre-Heading" name="pre_heading" class="mb-2" />
      <TextField label="Heading" name="heading" class="mb-2" />
      <TextAreaField label="Body" name="body" />
    </template>
    <template v-if="slideType == 'flexible'">
      <HtmlField label="Body" name="body" />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  TextAreaField,
  SelectField,
  HtmlField,
  TextField,
  getCurrentValue,
} from "vue-fields-ms";

const slideTypeChoices = [
  { key: "structured", label: "Structured - separate fields for headings" },
  { key: "flexible", label: "Flexible - place headings anywhere" },
];

const slideType = getCurrentValue("slide_type");
</script>

<template>
  <ExampleLayout title="Public Form (file uploads)" :code="sources" :values="liveVals">
    <template #description>
      <p>
        For public, submit-once forms that need a file attachment. <code>FileUploadField</code>
        keeps the form value tiny: it stores only a <em>token</em> (see "Live Values"), never the
        file bytes. The real file lives in a library-side cache and is reunited with the value at
        submit time by <code>useUploadedFiles()</code>.
      </p>
      <p>
        Two modes: <code>inline</code> (the CV) base64-encodes the file and submits it with the
        form; <code>upload</code> (the photos) sends each file to the server on selection — with a
        progress bar — and stores the returned token. A file field also works nested inside a
        <code>RepeaterField</code> (the references), since the value is just a token.
      </p>
      <p class="mb-0">
        <code>toFormData()</code> and <code>toJson()</code> produce symmetric payloads (a
        <code>data</code> blob of the value plus path-keyed <code>files</code>), so the backend can
        reassemble each file into the tree at its path and validate it as a unit — errors then come
        back keyed to match the field paths. Toggle the transport to compare the wire formats, and
        submit with an empty name to see a server validation error land on the right field.
      </p>
    </template>
    <template #form>
      <PublicFormExample ref="formRef" />
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleLayout from '../components/ExampleLayout.vue';
import PublicFormExample from '../examples/PublicFormExample.vue';
import publicFormCode from '../examples/PublicFormExample.vue?raw';

const sources = [
  { name: 'PublicFormExample.vue', source: publicFormCode },
];

const formRef = ref<InstanceType<typeof PublicFormExample>>();

const liveVals = computed(() => formRef.value?.vals ?? {});
</script>
